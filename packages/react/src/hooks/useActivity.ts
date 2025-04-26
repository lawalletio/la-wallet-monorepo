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

const MAX_LOOKBACK = 365 * 24 * 60 * 60;
const MAX_SUBSCRIPTION_TIME = 90 * 24 * 60 * 60;
const MAX_CACHED_TXS = 150;

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

  const { pubkey, enabled = true, limit = 1000, since: sinceParam, until, storage = false } = parameters;

  const config = useConfig(parameters);
  const { ndk, signerInfo } = useNostr();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activityInfo, setActivityInfo] = useState<ActivityType>(defaultActivity);
  const [reachedMaxLookback, setReachedMaxLookback] = useState<boolean>(false);

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
    (txs: TransactionInstance[], lastLookback: number) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      if (!pubkey) return;
  
      saveDebounceRef.current = setTimeout(async () => {
        let txsToStore: Transaction[] = [];

        if (txs.length) {
          const sorted = [...txs].sort((a, b) => b.createdAt - a.createdAt);
          const spliced = sorted.slice(0, MAX_CACHED_TXS);

          txsToStore = spliced.map((tx) => tx.toJSON());
        }
  
        const cacheToSave: CacheTransactions = {
          transactions: txsToStore,
          lastCached: txsToStore[0] ? txsToStore[0].createdAt / 1000 : nowInSeconds() - MAX_SUBSCRIPTION_TIME,
          lastLookback,
        };
  
        await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(cacheToSave));
      }, 300);
    },
    [config.storage, pubkey],
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

      const mostRecentStartedEvents = [...started].sort((a, b) => b.created_at - a.created_at).slice(0, MAX_CACHED_TXS);

      const txs: TransactionInstance[] = [];
      for (const startEvent of mostRecentStartedEvents) {
        const related = referencedBy.get(startEvent.id!) ?? [];
        const tx = new TransactionInstance(startEvent, related, pubkey, config, ndk);

        if (tx) txs.push(tx);
      }

      return txs.sort((a, b) => b.createdAt - a.createdAt);
    },
    [pubkey, ndk, signerInfo, config],
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
        
        if (storage) saveTransactionsCache([...lastSeenTransactions, ...txs], activityInfo.cache.lastLookback);
      }, 350);
    },
    [storage, activityInfo.cache.lastLookback, generateTransactions],
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
      deepSearch?: { enabled: boolean; maxLookback: number };
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

      const MAX_EMPTY_ATTEMTPS = 5;
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
        const oldestTx = txs.at(-1);
        const nextUntil = oldestTx ? Math.floor(oldestTx.createdAt / 1000) - 1 : currentSince - 1;
        const nextSince = nextUntil - (MAX_SUBSCRIPTION_TIME / 2);
  
        const withinLookback = deepSearch?.enabled
          ? (now - nextUntil) <= deepSearch.maxLookback
          : true;
  
        const canContinue = deepSearch?.enabled
          && totalLoaded < limit
          && emptyAttempts < MAX_EMPTY_ATTEMTPS
          && withinLookback;
  
        if (!canContinue) {
          break;
        }
  
        currentSince = nextSince;
        currentUntil = nextUntil;
      }
  
      return {
        transactions: loadedTxs.slice(0, limit),
        reachedMaxLookback: !deepSearch?.enabled ? false : (emptyAttempts >= MAX_EMPTY_ATTEMTPS || (now - currentUntil) > deepSearch.maxLookback),
      };
    },
    [pubkey, transactions, fetchTransactionsChunk],
  );

  const handleInitialDeepSearch = useCallback(async () => {
    if (!enabled || !pubkey || !storage) return;  
    if (transactions.length === 0) setActivityInfo((prev) => ({ ...prev, loading: true }));
  
    const now = nowInSeconds();
    const lastKnownCreatedAt = transactions.length
    ? Math.floor(transactions.at(-1)!.createdAt / 1000)
    : now;

    const { transactions: newTxs, reachedMaxLookback: reached } = await fetchTransactions({
      since: lastKnownCreatedAt - MAX_SUBSCRIPTION_TIME,
      until: lastKnownCreatedAt - 1,
      limit: MAX_CACHED_TXS - transactions.length,
      deepSearch: {
        enabled: true,
        maxLookback: MAX_LOOKBACK,
      },
    });

    const lastLookback = !reached && newTxs.length
    ? Math.floor(newTxs.at(-1)!.createdAt / 1000)
    : now - MAX_LOOKBACK;

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
  
    if (storage) saveTransactionsCache([...transactions, ...newTxs], lastLookback);
    if (reached) setReachedMaxLookback(true);
  
  }, [fetchTransactions, enabled, pubkey, storage, transactions]);

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
  
      if (hasUpdated && storage) saveTransactionsCache(transactions, activityInfo.cache.lastLookback);
    },
    [pubkey, enabled, transactions, storage]
  );

  useEffect(() => {
    if (statusPendingEvents?.length) {
      void processStatusEvents(statusPendingEvents);
    }
  }, [statusPendingEvents, processStatusEvents]);

  useEffect(() => {
    const now = nowInSeconds();
    const shouldDeepSearch =
      enabled &&
      pubkey &&
      activityInfo.cache.loaded &&
      transactions.length < MAX_CACHED_TXS &&
      (!activityInfo.cache.lastLookback || activityInfo.cache.lastLookback > now - MAX_LOOKBACK);
  
    if (!shouldDeepSearch) return;
  
    const timeout = setTimeout(() => {
      handleInitialDeepSearch();
    }, 3000);
  
    return () => clearTimeout(timeout);
  }, [enabled, pubkey, storage, transactions, activityInfo.cache]);

  useEffect(() => {
    if (!pubkey) {
      setActivityInfo(defaultActivity);
      return
    }
    
    if (activityInfo.cache.loaded) return;

    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => ({ ...prev, cache: { ...defaultActivity.cache, loaded: true } }));
  }, [pubkey, activityInfo.cache.loaded, storage, signerInfo]);

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
