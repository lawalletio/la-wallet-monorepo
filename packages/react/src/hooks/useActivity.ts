import {
  nowInSeconds,
  MappedStoragedKeys,
  internalTransactionFilters,
  internalStatusTransactionFilters,
  TransactionInstance,
  TransactionTags,
  LaWalletKinds,
  getMultipleTagsValues,
} from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
import type { Transaction } from '@lawallet/utils/types';
import { useSubscription } from './useSubscription.js';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { linkTxWithRelatedEvents } from '@lawallet/utils';

const MAX_SUBSCRIPTION_TIME = 90 * 24 * 60 * 60;
const MAX_CACHED_TXS = 150;

export type UseActivityReturns = {
  transactions: TransactionInstance[];
  loading: boolean;
};

export interface ActivitySubscriptionProps {
  pubkey: string;
}

export type ActivityType = {
  loading: boolean;
  cache: {
    transactions: TransactionInstance[];
    lastCached: number;
    loaded: boolean;
  };
  transactions: TransactionInstance[];
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

export function useActivity(parameters?: UseActivityProps): UseActivityReturns {
  if (!parameters) {
    const context = useLaWallet();
    if (!context) throw new Error('Missing context and parameters');
    return context.activity;
  }

  const { pubkey, enabled = true, limit = 1000, since: sinceParam, until, storage = false } = parameters;

  const config = useConfig(parameters);
  const { ndk } = useNostr();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activityInfo, setActivityInfo] = useState<ActivityType>(defaultActivity);

  const transactions = useMemo(() => {
    const combined = [...activityInfo.transactions, ...activityInfo.cache.transactions];
    const txMap = new Map<string, TransactionInstance>();
    for (const tx of combined) txMap.set(tx.id, tx);
    return Array.from(txMap.values());
  }, [activityInfo.transactions, activityInfo.cache.transactions]);

  const since = useMemo(
    () =>
      sinceParam ??
      (activityInfo.cache.lastCached > 0 ? activityInfo.cache.lastCached : undefined) ??
      nowInSeconds() - MAX_SUBSCRIPTION_TIME,
    [sinceParam, activityInfo],
  );

  const startTxsFilters = useMemo(
    () => internalTransactionFilters(pubkey, since, until, limit, config),
    [pubkey, since, until, limit, config],
  );

  const { events: startEvents } = useSubscription({
    filters: startTxsFilters,
    config,
    options: { groupable: false, closeOnEose: false },
    enabled: enabled && activityInfo.cache.loaded,
  });

  const saveTransactionsOnCache = useCallback(
    (txs: TransactionInstance[]) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

      saveDebounceRef.current = setTimeout(async () => {
        const sorted = [...txs].sort((a, b) => b.createdAt - a.createdAt);
        const spliced = sorted.slice(0, MAX_CACHED_TXS);
        const txsToStore = spliced.map((tx) => tx.toJSON());

        await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(txsToStore));
      }, 500);
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

    const cachedTxs: Transaction[] = JSON.parse(raw);
    const lastCachedTime = cachedTxs[0]?.events?.[0]?.created_at ?? nowInSeconds();

    const txs = await Promise.all(
      cachedTxs.map(async (tx) => {
        const start = tx.events.find((e) => e.id === tx.id)!;
        const related = tx.events.filter((e) => e.id !== tx.id);
        return TransactionInstance.create(start, pubkey, config, ndk, related);
      }),
    );

    setActivityInfo((prev) => ({
      ...prev,
      cache: { loaded: true, transactions: txs, lastCached: lastCachedTime },
      loading: false,
    }));
  }, [pubkey]);

  const generateTransactions = useCallback(
    async (events: NDKEvent[]) => {
      const rawEvents = await Promise.all(events.map((e) => e.toNostrEvent()));
      const { started, referencedBy } = await linkTxWithRelatedEvents(rawEvents, pubkey, config, ndk);

      const mostRecentStartedEvents = [...started].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_CACHED_TXS);

      const txs: TransactionInstance[] = [];
      for (const startEvent of mostRecentStartedEvents) {
        const related = referencedBy.get(startEvent.id!) ?? [];
        const tx = await TransactionInstance.create(startEvent, pubkey, config, ndk, related);

        if (tx) txs.push(tx);
      }

      return txs.sort((a, b) => b.createdAt - a.createdAt);
    },
    [pubkey, ndk, config, activityInfo],
  );

  const debouncedHandleEvents = useCallback(
    (events: NDKEvent[], lastSeenTransactions: TransactionInstance[]) => {
      const seen = new Set(lastSeenTransactions.flatMap((tx) => tx.events.map((e) => e.id)));
      const newEvents = events.filter((e) => !seen.has(e.id!));
      if (!newEvents.length) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActivityInfo((prev) => ({ ...prev, loading: true }));

      debounceRef.current = setTimeout(async () => {
        const txs = await generateTransactions(newEvents);

        setActivityInfo((prev) => ({
          ...prev,
          transactions: txs,
          cache: { ...prev.cache, transactions: lastSeenTransactions },
          loading: false,
        }));
        if (storage) saveTransactionsOnCache([...lastSeenTransactions, ...txs]);
      }, 350);
    },
    [storage, generateTransactions],
  );

  const loadMoreTransactions = useCallback(
    async (params?: { deepSearch: boolean }) => {
      let deepSearchActive = params?.deepSearch ?? false;
      const now = nowInSeconds();
      const maxLookback = 365 * 24 * 60 * 60;
      const chunkSize = MAX_SUBSCRIPTION_TIME / 2;

      const seen = new Set(transactions.flatMap((tx) => tx.events.map((e) => e.id)));

      let currentUntil = transactions.length ? Math.floor(transactions.at(-1)!.createdAt / 1000) - 1 : now;

      let loadedTxs: TransactionInstance[] = [];
      let emptyAttempts = 0;

      while (
        now - currentUntil <= maxLookback &&
        deepSearchActive &&
        loadedTxs.length + transactions.length < MAX_CACHED_TXS &&
        emptyAttempts < 5
      ) {
        const currentSince = currentUntil - chunkSize;

        const filters = [
          ...internalTransactionFilters(pubkey, currentSince, currentUntil, 1000),
          ...internalStatusTransactionFilters(pubkey, currentSince, currentUntil, limit, config),
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
        setActivityInfo((prev) => ({
          ...prev,
          cache: { ...prev.cache, transactions: [...prev.cache.transactions, ...loadedTxs] },
          loading: false,
        }));
        if (storage && deepSearchActive) saveTransactionsOnCache([...transactions, ...loadedTxs]);

        return true;
      }

      return false;
    },
    [transactions, activityInfo, storage, pubkey, config, ndk, generateTransactions],
  );

  const statusTxsFilter = useMemo(() => {
    const pendingTxs = transactions.filter((tx) => tx.isPending);

    if (!pendingTxs.length) return [];

    const pendingIds = pendingTxs.map((tx) => tx.id);

    return [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#t': [
          TransactionTags.INTERNAL.start,
          TransactionTags.INTERNAL.error,
          TransactionTags.INTERNAL.ok,
          TransactionTags.OUTBOUND.start,
          TransactionTags.OUTBOUND.ok,
          TransactionTags.OUTBOUND.error,
        ],
        '#e': pendingIds,
        limit: 1000,
      },
    ];
  }, [transactions, config.modulePubkeys]);

  useSubscription({
    filters: statusTxsFilter,
    config,
    options: { groupable: false, closeOnEose: false },
    enabled: Boolean(statusTxsFilter.length),
    onEvent(event) {
      const associatedIds = getMultipleTagsValues(event.tags, 'e');
      const tx = transactions.find((tx) => {
        return associatedIds.includes(tx.id);
      });

      if (tx) {
        const updatedTransaction = tx.updateWithEvent(event);
        if (updatedTransaction && storage) saveTransactionsOnCache(transactions);
      }
    },
  });

  useEffect(() => {
    const totalTxs = transactions.length;
    if (!pubkey || sinceParam || totalTxs >= MAX_CACHED_TXS || !enabled) return;

    const timeout = setTimeout(() => {
      if (totalTxs === 0) setActivityInfo((prev) => ({ ...prev, loading: true }));
      if (totalTxs <= MAX_CACHED_TXS) loadMoreTransactions({ deepSearch: true });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [pubkey, sinceParam, transactions]);

  useEffect(() => {
    if (activityInfo.cache.loaded) return;
    if (!pubkey) return setActivityInfo(defaultActivity);

    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => ({ ...prev, cache: { transactions: [], lastCached: 0, loaded: true } }));
  }, [pubkey, activityInfo.cache.loaded, storage]);

  useEffect(() => {
    if (startEvents.length) debouncedHandleEvents(startEvents, transactions);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startEvents, transactions, pubkey, activityInfo.cache.loaded]);

  return {
    transactions,
    loading: activityInfo.loading || (storage && !activityInfo.cache.loaded),
  };
}
