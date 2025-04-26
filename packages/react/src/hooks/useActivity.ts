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

const DEFAULT_MAX_LOOKBACK = 850 * 24 * 60 * 60;
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

type CacheTransactions = { transactions: Transaction[], lastCached: number, lastLookback: number };

export type ActivityType = {
  loading: boolean;
  cache: {
    transactions: TransactionInstance[];
    loaded: boolean;
    lastCached: number;
    lastLookback: number;
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
    lastCached: 0,
    lastLookback: 0
  },
  transactions: [],
};

export function useActivity(parameters?: UseActivityProps): UseActivityReturns {
  if (!parameters) {
    const context = useLaWallet();
    if (!context) throw new Error('Missing context and parameters');
    return context.activity;
  }

  const { pubkey, enabled = true, limit = DEFAULT_MAX_LIMIT, since: sinceParam, until, maxLookback = DEFAULT_MAX_LOOKBACK, storage = false } = parameters;

  const config = useConfig(parameters);
  const { ndk, signerInfo } = useNostr();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activityInfo, setActivityInfo] = useState<ActivityType>(defaultActivity);

  const reachedMaxLookback = useMemo(() => {
    return (activityInfo.cache.lastLookback >= maxLookback)
  }, [activityInfo.cache.lastLookback, maxLookback])

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

  const saveTransactionsCache = useCallback(
    (txs: TransactionInstance[], maxLookbackReached: boolean) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      if (!pubkey || !storage) return;
  
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
          lastCached: newestTransaction
          ? Math.floor(newestTransaction.createdAt / 1000)
          : defaultTime,
          lastLookback: maxLookbackReached
          ? nowInSeconds() - maxLookback
          : oldestTransaction
            ? Math.floor(oldestTransaction.createdAt / 1000)
            : defaultTime,
        };
  
        await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(cacheToSave));
      }, 300);
    },
    [storage, limit, pubkey],
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

    setActivityInfo((prev) => ({
      ...prev,
      cache: { loaded: true, transactions: txs, lastCached: cachedTxInfo.lastCached, lastLookback: cachedTxInfo.lastLookback },
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

  const debouncedHandleEvents = useCallback(
    (events: NDKEvent[], lastSeenTransactions: TransactionInstance[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const seen = new Set(lastSeenTransactions.flatMap((tx) => tx.events.map((e) => e.id)));
      const newEvents = events.filter((e) => !seen.has(e.id!));
      if (!newEvents.length) return;

      debounceRef.current = setTimeout(async () => {
        setActivityInfo((prev) => ({ ...prev, loading: true }));

        const txs = await generateTransactions(newEvents);

        setActivityInfo((prev) => ({
          ...prev,
          transactions: txs ?? [],
          cache: { ...prev.cache, transactions: lastSeenTransactions, lastCached: lastSeenTransactions[0] ? lastSeenTransactions[0].createdAt / 1000 : nowInSeconds() },
          loading: false,
        }));
        
        if (storage) saveTransactionsCache([...lastSeenTransactions, ...txs], reachedMaxLookback);
      }, 350);
    },
    [storage, reachedMaxLookback, generateTransactions],
  );

  const fetchTransactionsChunk = useCallback(
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

  const fetchTransactions = useCallback(
    async ({
      since,
      until,
      limit,
      deepSearch,
    }: {
      since: number;
      until: number;
      limit: number;
      deepSearch?: { enabled: boolean; maxEmptyAttempts: number, maxLookback: number };
    }): Promise<{ transactions: TransactionInstance[]; reachedMaxLookback: boolean }> => {
      if (!pubkey) return { transactions: [], reachedMaxLookback: false };

      const now = nowInSeconds();
      const loadedTxs: TransactionInstance[] = [];
      const seen = new Set(
        transactions.flatMap((tx) =>
          tx.events
            .map((e) => e.id)
            .filter((id): id is string => !!id)
        )
      );

      let emptyAttempts = 0;
  
      let currentSince = since;
      let currentUntil = until;
  
      while (true) {
        const txs = await fetchTransactionsChunk(currentSince, currentUntil, seen);
  
        if (txs.length) {
          loadedTxs.push(...txs);
          txs.forEach((tx) => tx.events.forEach((e) => seen.add(e.id!)));
          emptyAttempts = 0;
        } else {
          emptyAttempts++;
        }

        const totalLoaded = loadedTxs.length;
        if (totalLoaded > 0 && transactions.length === 0) setActivityInfo((prev) => ({ ...prev, loading: true }))

        const oldestTx = txs.at(-1);
        const nextUntil = oldestTx ? Math.floor(oldestTx.createdAt / 1000) - 1 : currentSince - 1;
        const nextSince = nextUntil - (MAX_SUBSCRIPTION_TIME / 2);

        currentSince = nextSince;
        currentUntil = nextUntil;
  
        const withinLookback = deepSearch?.enabled
          ? (now - currentUntil) <= deepSearch.maxLookback
          : true;
  
        const canContinue = deepSearch?.enabled
          && totalLoaded < limit
          && emptyAttempts < deepSearch.maxEmptyAttempts
          && withinLookback;
  
          
        if (!canContinue) {
          break;
        }  
      }
  
      return {
        transactions: loadedTxs.slice(0, limit),
        reachedMaxLookback: !deepSearch?.enabled ? false : (emptyAttempts >= deepSearch.maxEmptyAttempts || (now - currentUntil) >= deepSearch.maxLookback),
      };
    },
    [pubkey, transactions, fetchTransactionsChunk],
  );

  const deepSearchTransactions = useCallback(async (transactionsLimit: number) => {
    if (!enabled || !pubkey || !storage || sinceParam) return;
  
    const now = nowInSeconds();
    const lastKnownCreatedAt = transactions.length
    ? Math.floor(transactions.at(-1)!.createdAt / 1000)
    : now;

    const { transactions: newTxs, reachedMaxLookback: reached } = await fetchTransactions({
      since: lastKnownCreatedAt - MAX_SUBSCRIPTION_TIME,
      until: lastKnownCreatedAt - 1,
      limit: transactionsLimit,
      deepSearch: {
        enabled: true,
        maxEmptyAttempts: 15,
        maxLookback,
      },
    });

    const lastLookback = !reached && newTxs.length
    ? Math.floor(newTxs.at(-1)!.createdAt / 1000)
    : now - maxLookback;

    setActivityInfo((prev) => ({
      ...prev,
      cache: {
        transactions: newTxs,
        loaded: true,
        lastCached: now,
        lastLookback,
      },
      loading: false,
    }));
  
    if (storage) saveTransactionsCache([...transactions, ...newTxs], reached);
  
  }, [sinceParam, limit, fetchTransactions, enabled, pubkey, storage, transactions]);

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
      let hasUpdated = false;
  
      for (const event of rawEvents) {
        const associatedIds = getMultipleTagsValues(event.tags, 'e');
        const tx = transactions.find((tx) => associatedIds.includes(tx.id));
        if (tx) {
          const updated = tx.updateWithEvent(event);
          if (updated) hasUpdated = true;
        }
      }
  
      if (hasUpdated && storage) saveTransactionsCache(transactions, reachedMaxLookback);
    },
    [pubkey, enabled, reachedMaxLookback, transactions, storage]
  );

  useEffect(() => {
    if (statusPendingEvents?.length) {
      void processStatusEvents(statusPendingEvents);
    }
  }, [statusPendingEvents, processStatusEvents]);

  useEffect(() => {
    const shouldDeepSearch =
      !sinceParam &&
      enabled &&
      pubkey &&
      activityInfo.cache.loaded &&
      activityInfo.transactions.length + activityInfo.cache.transactions.length  < limit &&
      !reachedMaxLookback;
  
    if (!shouldDeepSearch) return;
  
    const transactionsLimit = limit - activityInfo.transactions.length + activityInfo.cache.transactions.length;
    const timeout = setTimeout(() => {
      deepSearchTransactions(transactionsLimit);
    }, 1000);
  
    return () => clearTimeout(timeout);
  }, [enabled, reachedMaxLookback, limit, sinceParam, until, pubkey, storage,  activityInfo]);

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
    if (!enabled || !pubkey) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (startEvents.length) debouncedHandleEvents(startEvents, transactions);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startEvents, enabled, transactions, pubkey, activityInfo.cache.loaded]);

  return {
    transactions,
    loading: activityInfo.loading || (storage && !activityInfo.cache.loaded),
    reachedMaxLookback
  };
}
