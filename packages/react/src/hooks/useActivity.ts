import {
  LaWalletKinds,
  nowInSeconds,
  MappedStoragedKeys,
  getTagValue,
} from '@lawallet/utils';
import { TransactionStatus, type ConfigParameter } from '@lawallet/utils/types';
import type { Transaction } from '@lawallet/utils/types';
import { useSubscription } from './useSubscription.js';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { classificateTxEvents, TransactionParser, TransactionTags } from '@lawallet/utils';

const MAX_SUBSCRIPTION_TIME = 90 * 24 * 60 * 60;
const MAX_CACHED_TXS = 150;

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
    lastCached: nowInSeconds() - MAX_SUBSCRIPTION_TIME,
  },
  transactions: [],
};

function splitTransactionsForCache(transactions: Transaction[], max = 200): Transaction[] {
  const sorted = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

  const lastPendingIndex = sorted.findIndex(tx => tx.status === TransactionStatus.PENDING);
  const sliced = lastPendingIndex !== -1 ? sorted.slice(lastPendingIndex + 1) : sorted;

  const filtered = sliced.filter(tx => tx.status !== TransactionStatus.PENDING);
  return filtered.slice(0, max);
}

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

  const since = useMemo(() =>
    sinceParam ??
    (activityInfo.cache.lastCached > 0 ? activityInfo.cache.lastCached : undefined) ??
    (nowInSeconds() - MAX_SUBSCRIPTION_TIME),
  [sinceParam, activityInfo]);

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
    options: { groupable: false, closeOnEose: false },
    enabled: enabled && activityInfo.cache.loaded,
  });

  const transactions = useMemo(() => {
    const combined = [...activityInfo.transactions, ...activityInfo.cache.transactions];
    const txMap = new Map<string, Transaction>();
    for (const tx of combined) txMap.set(tx.id, tx);
    return Array.from(txMap.values());
  }, [activityInfo.transactions, activityInfo.cache.transactions]);

  const saveTransactionsOnCache = useCallback(
    async (txs: Transaction[]) => {
      const toCache = splitTransactionsForCache(txs, MAX_CACHED_TXS);
      await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(toCache));
    },
    [pubkey],
  );

  const loadCachedTransactions = useCallback(async () => {
    const raw = await config.storage.getItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`);
    if (!raw) {
      return setActivityInfo((prev) => ({
        ...prev,
        cache: { loaded: true, transactions: [], lastCached: 0 },
        loading: false,
      }));
    }
  
    const cachedTxs = JSON.parse(raw);
    const lastCachedTime = cachedTxs[0]?.events?.[0]?.created_at ?? nowInSeconds();
  
    setActivityInfo((prev) => ({
      ...prev,
      cache: { loaded: true, transactions: cachedTxs, lastCached: lastCachedTime },
      loading: false,
    }));
  }, [pubkey]);

  const generateTransactions = useCallback(
    async (events: NDKEvent[]) => {
      const rawEvents = await Promise.all(events.map((e) => e.toNostrEvent()));
      const { started, referencedBy } = await classificateTxEvents(rawEvents, pubkey, config, ndk);

      const mostRecentStartedEvents = [...started]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, MAX_CACHED_TXS);
  
      const txs: Transaction[] = [];
      for (const startEvent of mostRecentStartedEvents) {
        const related = referencedBy.get(startEvent.id!) ?? [];
        const parser = new TransactionParser(startEvent, related, pubkey, config, decrypt);
        const tx = await parser.toTransaction();
        if (tx) txs.push(tx);
      }
  
      return txs.sort((a, b) => b.createdAt - a.createdAt);
    },
    [decrypt, pubkey, ndk, config, activityInfo],
  );

  const debouncedHandleEvents = useCallback(
    (events: NDKEvent[]) => {
      const seen = new Set(transactions.flatMap((tx) => tx.events.map((e) => e.id)));
      const newEvents = events.filter((e) => !seen.has(e.id!));
      if (!newEvents.length) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActivityInfo((prev) => ({ ...prev, loading: true }));
  
      debounceRef.current = setTimeout(async () => {
        const txs = await generateTransactions(newEvents);
  
        setActivityInfo((prev) => ({ ...prev, transactions: txs, loading: false }));
        if (storage) saveTransactionsOnCache([...transactions, ...txs]);
      }, 350);
    },
    [transactions, storage, generateTransactions],
  );

  useEffect(() => {
    if (txsEvents.length) debouncedHandleEvents(txsEvents);
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [txsEvents.length, pubkey, activityInfo.cache.loaded]);

  const loadMoreTransactions = useCallback(async (params?: { deepSearch: boolean }) => {
    let deepSearchActive = params?.deepSearch ?? false;
    const now = nowInSeconds();
    const maxLookback = 365 * 24 * 60 * 60;
    const chunkSize = MAX_SUBSCRIPTION_TIME / 2;

    const seen = new Set(transactions.flatMap((tx) => tx.events.map((e) => e.id)));
  
    let currentUntil = transactions.length
      ? Math.floor(transactions.at(-1)!.createdAt / 1000) - 1
      : now;
  
    let loadedTxs: Transaction[] = [];
    let emptyAttempts = 0;
  
    while (
      (now - currentUntil) <= maxLookback &&
      (deepSearchActive && loadedTxs.length + transactions.length < MAX_CACHED_TXS) &&
      emptyAttempts < 6
    ) {
      const currentSince = currentUntil - chunkSize;

      const filters = 
      [
        {
          authors: [pubkey],
          kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
          '#t': [TransactionTags.INTERNAL.start],
          since: currentSince,
          until: currentUntil,
          limit: 1000,
        },
        {
          '#p': [pubkey],
          '#t': [TransactionTags.INTERNAL.start],
          kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
          since: currentSince,
          until: currentUntil,
          limit: 1000,
        },
        {
          authors: [config.modulePubkeys.ledger],
          '#p': [pubkey],
          '#t': [
            TransactionTags.INTERNAL.ok,
            TransactionTags.INTERNAL.error,
            TransactionTags.OUTBOUND.ok,
            TransactionTags.OUTBOUND.error,
          ],
          kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
          since: currentSince,
          until: currentUntil,
          limit: 1000,
        },
      ];
  
      const events = await ndk.fetchEvents(filters, { groupable: false, closeOnEose: true });
      if (!events.size) {
        emptyAttempts++;
        currentUntil = currentSince;
        continue;
      }

      const eventsArray = Array.from(events);
      const unseenEvents = eventsArray.filter((e) => !seen.has(e.id!));
      if (!unseenEvents.length) {
        emptyAttempts++;
        currentUntil = currentSince;
        continue;
      }

      const txs = await generateTransactions(unseenEvents);
      if (!txs.length) {
        emptyAttempts++;
        currentUntil = currentSince;
        continue;
      }
  
      emptyAttempts = 0;
      loadedTxs.push(...txs);
      if (!deepSearchActive) break;

      const oldestTx = txs.at(-1);
      if (oldestTx) {
        currentUntil = Math.floor(oldestTx.createdAt / 1000) - 1;
      } else {
        currentUntil = currentSince;
      }
    }
    
    if (loadedTxs.length) {
      setActivityInfo((prev) => ({...prev, cache: { ...prev.cache, transactions: [...prev.cache.transactions, ...loadedTxs] }, loading: false }))
      if (storage) saveTransactionsOnCache([...transactions, ...loadedTxs]);

      return true;
    }

    return false;
  }, [transactions, activityInfo, storage, pubkey, config, ndk, generateTransactions]);

  useEffect(() => {
    const totalTxs = transactions.length;
    if (!pubkey || sinceParam || totalTxs >= MAX_CACHED_TXS) return;
  
    const timeout = setTimeout(() => {
      if (totalTxs === 0) setActivityInfo((prev) => ({ ...prev, loading: true }));
      if (totalTxs <= MAX_CACHED_TXS) loadMoreTransactions({ deepSearch: true });
    }, 3000);
  
    return () => clearTimeout(timeout);
  }, [pubkey, sinceParam, transactions]);

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
