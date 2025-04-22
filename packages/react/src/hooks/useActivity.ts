import {
  LaWalletKinds,
  nowInSeconds,
  MappedStoragedKeys,
  getTagValue,
} from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
import type { Transaction } from '@lawallet/utils/types';
import { useSubscription } from './useSubscription.js';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { classificateTxEvents, splitTransactionsForCache, TransactionParser, TransactionTags } from '@lawallet/utils';

const MAX_TRANSACTIONS_TIME = 180 * 24 * 60 * 60;
const MAX_CACHED_TXS = 200;

export type UseActivityReturns = {
  transactions: Transaction[];
  loading: boolean;
};

export interface ActivitySubscriptionProps {
  pubkey: string;
}

export type ActivityType = {
  loading: boolean;
  cache: {
    transactions: Transaction[];
    lastCached: number;
    loaded: boolean;
  };
  transactions: Transaction[];
};

export interface UseActivityProps extends ConfigParameter {
  pubkey: string;
  since?: number | undefined;
  until?: number | undefined;
  limit?: number;
  enabled?: boolean;
  storage?: boolean;
}

const defaultActivity: ActivityType = {
  loading: true,
  cache: {
    transactions: [],
    loaded: false,
    lastCached: nowInSeconds() - MAX_TRANSACTIONS_TIME,
  },
  transactions: [],
};

export function useActivity(parameters?: UseActivityProps): UseActivityReturns {
  if (!parameters) {
    const context = useLaWallet();
    if (!context) throw new Error('Missing context and parameters');
    return context.activity;
  }

  const { pubkey, enabled = true, limit = 1000, since: sinceParam, until, storage = false } = parameters;

  const config = useConfig(parameters);
  const { ndk, decrypt } = useNostr();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [activityInfo, setActivityInfo] = useState<ActivityType>(defaultActivity);

  const since = useMemo(
    () => sinceParam ?? activityInfo.cache.lastCached ?? nowInSeconds() - MAX_TRANSACTIONS_TIME,
    [sinceParam, activityInfo],
  );

  const filters = useMemo(
    () => [
      {
        authors: [pubkey],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#t': [TransactionTags.INTERNAL.start],
        since,
        until,
        limit: limit * 2,
      },
      {
        '#p': [pubkey],
        '#t': [TransactionTags.INTERNAL.start],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since,
        until,
        limit: limit * 2,
      },
      {
        authors: [config.modulePubkeys.ledger],
        '#p': [pubkey],
        '#t': [
          TransactionTags.INTERNAL.ok,
          TransactionTags.INTERNAL.error,
          TransactionTags.OUTBOUND.ok,
          TransactionTags.OUTBOUND.error
        ],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since,
        until,
        limit: limit * 2,
      },
    ],
    [pubkey, since, until, limit, config],
  );

  const { events: txsEvents } = useSubscription({
    filters,
    config,
    options: { groupable: true, closeOnEose: false },
    enabled: enabled && activityInfo.cache.loaded,
  });

  const transactions = useMemo(() => {
    const combined = [...activityInfo.transactions, ...activityInfo.cache.transactions];
    const txMap = new Map<string, Transaction>();
    for (const tx of combined) txMap.set(tx.id, tx);
    return Array.from(txMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [activityInfo.transactions.length, activityInfo.cache.transactions.length]);

  const saveTransactionsOnCache = useCallback(
    async (transactions: Transaction[]) => {
      const toCache = splitTransactionsForCache(transactions).slice(0, MAX_CACHED_TXS);
      await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(toCache));
    },
    [pubkey],
  );

  const loadCachedTransactions = useCallback(async () => {
    const raw = await config.storage.getItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`);
    if (!raw)
      return setActivityInfo((prev) => ({
        ...prev,
        cache: { loaded: true, transactions: [], lastCached: 0 },
        loading: false,
      }));

    const cachedTxs = JSON.parse(raw);
    const toCache = splitTransactionsForCache(cachedTxs);
    const lastCachedTime = Math.floor((toCache[0]?.createdAt ?? nowInSeconds()) / 1000) - 3600;
    setActivityInfo((prev) => ({
      ...prev,
      cache: { loaded: true, transactions: toCache, lastCached: lastCachedTime },
      loading: false,
    }));
  }, [pubkey]);

  const generateTransactions = useCallback(
    async (events: NDKEvent[]) => {
      const rawEvents = await Promise.all(events.map((e) => e.toNostrEvent()));
      const { started, referencedBy } = await classificateTxEvents(rawEvents, pubkey, config, ndk);

      const txs: Transaction[] = [];
      for (const startEvent of started) {
        const related = referencedBy.get(startEvent.id!) ?? [];
        const parser = new TransactionParser(startEvent, related, pubkey, config, decrypt);
        const tx = await parser.toTransaction();
        if (tx) txs.push(tx);
      }

      setActivityInfo((prev) => ({ ...prev, transactions: txs, loading: false }));
      if (storage) saveTransactionsOnCache([...activityInfo.cache.transactions, ...txs]);
    },
    [decrypt, pubkey, ndk, config, storage, activityInfo],
  );

  const debouncedHandleEvents = useCallback(
    (events: NDKEvent[]) => {
      const seen = new Set(transactions.flatMap((tx) => tx.events.map((e) => e.id)));
      const hasNew = events.some((e) => !seen.has(e.id!));
      if (!hasNew) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActivityInfo((prev) => ({ ...prev, loading: true }));
      debounceRef.current = setTimeout(() => generateTransactions(events), 350);
    },
    [transactions, generateTransactions],
  );

  useEffect(() => {
    if (txsEvents.length) debouncedHandleEvents(txsEvents);
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [txsEvents.length]);

  useEffect(() => {
    if (!pubkey) return setActivityInfo(defaultActivity);
    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => ({ ...prev, cache: { transactions: [], lastCached: 0, loaded: true } }));
  }, [pubkey, storage]);

  return {
    transactions,
    loading: activityInfo.loading || (storage && !activityInfo.cache.loaded),
  };
}
