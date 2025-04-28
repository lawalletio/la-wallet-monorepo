import {
  nowInSeconds,
  MappedStoragedKeys,
  internalTransactionFilters,
  internalStatusTransactionFilters,
  TransactionInstance,
  getMultipleTagsValues,
  relatedTxEventFilters,
} from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
import type { Transaction } from '@lawallet/utils/types';
import { useSubscription } from './useSubscription.js';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NDKEvent } from '@nostr-dev-kit/ndk';
import { linkTxWithRelatedEvents } from '@lawallet/utils';

const MAX_SUBSCRIPTION_TIME = 90 * 24 * 60 * 60;
const DEFAULT_MAX_LIMIT = 1000;

export type UseActivityReturns = {
  transactions: TransactionInstance[];
  loading: boolean;
  reachedMaxLookback: boolean;
};

export interface ActivitySubscriptionProps {
  pubkey: string;
}

type CacheTransactions = { transactions: Transaction[], lastUntilChecked: number, lastSinceChecked: number };

export type ActivityType = {
  loading: boolean;
  cache: {
    transactions: TransactionInstance[];
    loaded: boolean;
    lastUntilChecked: number;
    lastSinceChecked: number;
  };
  transactions: TransactionInstance[];
};

export interface UseActivityProps extends ConfigParameter {
  pubkey: string;
  since?: number | undefined;
  until?: number | undefined;
  limit?: number;
  maxLookback?: number;
  enabled?: boolean;
  storage?: boolean;
}

const defaultActivity: ActivityType = {
  loading: true,
  cache: {
    transactions: [],
    loaded: false,
    lastUntilChecked: 0,
    lastSinceChecked: nowInSeconds() - MAX_SUBSCRIPTION_TIME
  },
  transactions: [],
};

export function useActivity(parameters?: UseActivityProps): UseActivityReturns {
  if (!parameters) {
    const context = useLaWallet();
    if (!context) throw new Error('Missing context and parameters');
    return context.activity;
  }

  const { pubkey, enabled = true, limit = DEFAULT_MAX_LIMIT, since: sinceParam, until, storage = false } = parameters;

  const config = useConfig(parameters);
  const { ndk, signerInfo } = useNostr();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activityInfo, setActivityInfo] = useState<ActivityType>(defaultActivity);

  const reachedMaxLookback = useMemo(() => (activityInfo.cache.lastSinceChecked === 0), [activityInfo.cache.lastSinceChecked])

  const transactions = useMemo(() => {
    const combined = [...activityInfo.transactions, ...activityInfo.cache.transactions];
    const txMap = new Map<string, TransactionInstance>();
    for (const tx of combined) txMap.set(tx.id, tx);
    return Array.from(txMap.values());
  }, [activityInfo.transactions, activityInfo.cache.transactions]);

  const since = useMemo(
    () =>
      sinceParam ??
      (activityInfo.cache.lastUntilChecked > 0 ? activityInfo.cache.lastUntilChecked : undefined) ??
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

  const saveTransactionsCache = useCallback(
    (txs: TransactionInstance[]) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      if (!pubkey) return;
  
      saveDebounceRef.current = setTimeout(async () => {
        let txsToStore: Transaction[] = [];

        if (txs.length) {
          const sorted = [...txs].sort((a, b) => b.createdAt - a.createdAt);
          const spliced = sorted.slice(0, limit);

          txsToStore = spliced.map((tx) => tx.toJSON());
        }

        const defaultTime = nowInSeconds() - MAX_SUBSCRIPTION_TIME;
        const newestTransaction = txsToStore[0];
        const oldestTransaction = txsToStore.at(-1);
  
        const cacheToSave: CacheTransactions = {
          transactions: txsToStore,
          lastUntilChecked: newestTransaction
          ? Math.floor(newestTransaction.createdAt / 1000)
          : defaultTime,
          lastSinceChecked: txsToStore.length < limit && activityInfo.cache.lastSinceChecked == 0
          ? 0
          : oldestTransaction
            ? Math.floor(oldestTransaction.createdAt / 1000)
            : defaultTime,
        };
  
        await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(cacheToSave));
      }, 300);
    },
    [activityInfo, limit],
  );

  const loadCachedTransactions = useCallback(async () => {
    if (!signerInfo || signerInfo.pubkey !== pubkey) return;

    const raw = await config.storage.getItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`);
    if (!raw) {
      return setActivityInfo((prev) => ({
        ...prev,
        cache: { ...defaultActivity.cache, loaded: true },
        loading: false,
      }));
    }

    const cachedTxInfo: CacheTransactions = JSON.parse(raw);

    const txs = await Promise.all(
      cachedTxInfo.transactions.map(async (tx) => {
        const start = tx.events.find((e) => e.id === tx.id)!;
        const related = tx.events.filter((e) => e.id !== tx.id);
        return TransactionInstance.create(start, pubkey, config, ndk, related);
      }),
    );

    const { lastUntilChecked, lastSinceChecked } = cachedTxInfo;

    setActivityInfo((prev) => ({
      ...prev,
      cache: { loaded: true, transactions: txs, lastUntilChecked, lastSinceChecked },
      loading: false,
    }));
  }, [pubkey, ndk, signerInfo]);

  const generateTransactions = useCallback(
    async (events: NDKEvent[]) => {
      if (!signerInfo || signerInfo.pubkey !== pubkey) return [];
      
      const rawEvents = await Promise.all(events.map((e) => e.toNostrEvent()));
      const { started, referencedBy } = await linkTxWithRelatedEvents(rawEvents, pubkey, config, ndk);

      const mostRecentStartedEvents = limit ? [...started].sort((a, b) => b.created_at - a.created_at).slice(0, limit) : started;

      const txs: TransactionInstance[] = [];
      for (const startEvent of mostRecentStartedEvents) {
        const related = referencedBy.get(startEvent.id!) ?? [];
        const tx = new TransactionInstance(startEvent, related, pubkey, config, ndk);

        if (tx) txs.push(tx);
      }

      return txs.sort((a, b) => b.createdAt - a.createdAt);
    },
    [pubkey, ndk, signerInfo, limit, config],
  );

  const fetchTransactions = useCallback(
    async (since: number, until: number, seen: Set<string>): Promise<TransactionInstance[]> => {
      if (!pubkey) return [];

      const filters = [
        ...internalTransactionFilters(pubkey, since, until, 1000, config),
        ...internalStatusTransactionFilters(pubkey, since, until, 1000, config),
      ];
  
      const events = await ndk.fetchEvents(filters, { groupable: false, closeOnEose: true });
      if (!events.size) {
        return [];
      }
  
      const eventsArray = Array.from(events);
      const unseenEvents = eventsArray.filter((e) => !seen.has(e.id!));
      unseenEvents.forEach((e) => seen.add(e.id!));
  
      if (!unseenEvents.length) {
        return [];
      }
  
      return generateTransactions(unseenEvents);
    },
    [pubkey, config, ndk, generateTransactions],
  );

  const loadHistoricalTransactions = useCallback(async (transactionsLimit: number) => {
    if (!enabled || !pubkey || sinceParam) return;
  
    const now = nowInSeconds();
    const loadedTxs: TransactionInstance[] = [];
    const seen = new Set(
      transactions.flatMap((tx) =>
        tx.events.map((e) => e.id).filter((id): id is string => !!id)
      )
    );
  
    const lastKnownCreatedAt = transactions.length
      ? Math.floor(transactions.at(-1)!.createdAt / 1000)
      : now;
  
    let currentSince = lastKnownCreatedAt - (MAX_SUBSCRIPTION_TIME / 2);
    let currentUntil = lastKnownCreatedAt - 1;
  
    let emptyAttempts = 0;
    let reachedMaxLookback = false;
    let txs: TransactionInstance[] = []
  
    while (true) {
      txs = await fetchTransactions(currentSince, currentUntil, seen);
  
      if (txs.length) {
        loadedTxs.push(...txs);
        txs.forEach((tx) => tx.events.forEach((e) => seen.add(e.id!)));
        emptyAttempts = 0;
      } else {
        emptyAttempts++;
      }
  
      if (loadedTxs.length > 0 && transactions.length === 0) {
        setActivityInfo((prev) => ({ ...prev, loading: true }));
      }
  
      if (loadedTxs.length >= transactionsLimit) {
        break;
      }
  
      if (emptyAttempts >= 3) {
        txs = await fetchTransactions(0, currentUntil, seen);
  
        if (txs.length) {
          loadedTxs.push(...txs);
          txs.forEach((tx) => tx.events.forEach((e) => seen.add(e.id!)));
        }

        reachedMaxLookback = true;
  
        break;
      }
  
      const oldestTx = txs.at(-1);
      const nextUntil = oldestTx ? Math.floor(oldestTx.createdAt / 1000) - 1 : currentSince - 1;
      const nextSince = nextUntil - (MAX_SUBSCRIPTION_TIME / 2);
  
      currentSince = nextSince;
      currentUntil = nextUntil;
    }
  
    const lastSinceChecked = !reachedMaxLookback && loadedTxs.length
      ? Math.floor(loadedTxs.at(-1)!.createdAt / 1000)
      : 0;
  
    setActivityInfo((prev) => ({
      ...prev,
      cache: {
        transactions: loadedTxs,
        loaded: true,
        lastUntilChecked: now,
        lastSinceChecked,
      },
      loading: false,
    }));  
  }, [sinceParam, enabled, pubkey, transactions, fetchTransactions]);

  const debouncedHandleEvents = useCallback(
    (events: NDKEvent[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!enabled || !pubkey) return;

      debounceRef.current = setTimeout(async () => {
        const tryLoadOlderTransactions = (txs: TransactionInstance[]) => {
          if (activityInfo.cache.lastSinceChecked !== 0 && txs.length < limit) loadHistoricalTransactions(limit - txs.length)
        }

        const seen = new Set(transactions.flatMap((tx) => tx.events.map((e) => e.id)));
        const newEvents = events.filter((e) => !seen.has(e.id!));
        if (!newEvents.length) {
          tryLoadOlderTransactions(transactions);
          return;
        }

        setActivityInfo((prev) => ({ ...prev, loading: true }));

        const txs = await generateTransactions(newEvents);

        setActivityInfo((prev) => ({
          ...prev,
          transactions: txs ?? [],
          cache: { ...prev.cache, transactions, lastUntilChecked: transactions[0] ? transactions[0].createdAt / 1000 : nowInSeconds() },
          loading: false,
        }));
      }, 500);
    },
    [transactions, startEvents, limit, activityInfo.cache.lastSinceChecked, pubkey, enabled, generateTransactions, loadHistoricalTransactions],
  );

  const statusTxsFilter = useMemo(() => {
    const pendingTxs = transactions.filter((tx) => tx.isPending);
    const pendingIds = pendingTxs.map((tx) => tx.id);
  
    return relatedTxEventFilters(pendingIds, config);
  }, [transactions, config]);

  const { events: statusPendingEvents } = useSubscription({
    filters: statusTxsFilter,
    config,
    options: { groupable: false, closeOnEose: false },
    enabled: Boolean(statusTxsFilter.length),
  });

  const processStatusEvents = useCallback(
    async (events: NDKEvent[]) => {
      if (!pubkey || !enabled || !events.length) return;
  
      const rawEvents = await Promise.all(events.map((e) => e.toNostrEvent()));
  
      for (const event of rawEvents) {
        const associatedIds = getMultipleTagsValues(event.tags, 'e');
        const tx = transactions.find((tx) => associatedIds.includes(tx.id));
        if (tx) tx.updateWithEvent(event);
      }
    },
    [pubkey, enabled, transactions, storage]
  );

  useEffect(() => {
    if (statusPendingEvents?.length) {
      void processStatusEvents(statusPendingEvents);
    }
  }, [statusPendingEvents, processStatusEvents]);

  useEffect(() => {
    if (!pubkey) {
      setActivityInfo(defaultActivity);
      return
    }
    
    if (activityInfo.cache.loaded || sinceParam) return;

    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => ({ ...prev, cache: { ...defaultActivity.cache, loaded: true } }));
  }, [pubkey, sinceParam, activityInfo.cache.loaded, storage, signerInfo]);

  useEffect(() => {
    debouncedHandleEvents(startEvents);
  }, [debouncedHandleEvents]);

  useEffect(() => {
    if (!enabled || !pubkey || !activityInfo.cache.loaded) return;

    if (pubkey && transactions.length >= activityInfo.cache.transactions.length) saveTransactionsCache(transactions);
  }, [transactions, storage, pubkey, enabled, activityInfo.cache])

  return {
    transactions,
    loading: activityInfo.loading || (storage && !activityInfo.cache.loaded),
    reachedMaxLookback
  };
}
