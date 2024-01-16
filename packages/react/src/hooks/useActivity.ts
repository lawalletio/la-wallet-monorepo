import { LaWalletKinds, LaWalletTags, getMultipleTags, getTag, parseContent } from '@lawallet/utils';

import { type Transaction, TransactionDirection, TransactionStatus, TransactionType } from '@lawallet/utils/types';

import * as React from 'react';

import { type NDKEvent, type NDKKind, type NDKSubscriptionOptions, type NostrEvent } from '@nostr-dev-kit/ndk';

import { type Event, nip26 } from 'nostr-tools';
import { useSubscription } from './useSubscription.js';
import { CACHE_TXS_KEY } from '../constants/constants.js';
import type { ConfigParameter } from '../types/config.js';
import { useConfig } from './useConfig.js';

export interface ActivitySubscriptionProps {
  pubkey: string;
}

export type ActivityType = {
  loading: boolean;
  lastCached: number;
  cached: Transaction[];
  subscription: Transaction[];
  idsLoaded: string[];
};

export interface UseActivityReturns {
  transactions: Transaction[];
}

export interface UseActivityProps extends ConfigParameter {
  pubkey: string;
  since?: number | undefined;
  until?: number | undefined;
  limit?: number;
  enabled?: boolean;
  storage?: boolean;
}

export const options: NDKSubscriptionOptions = {
  groupable: false,
  closeOnEose: false,
};

const startTags: string[] = [LaWalletTags.INTERNAL_TRANSACTION_START, LaWalletTags.INBOUND_TRANSACTION_START];

const statusTags: string[] = [
  LaWalletTags.INTERNAL_TRANSACTION_OK,
  LaWalletTags.INTERNAL_TRANSACTION_ERROR,
  LaWalletTags.OUTBOUND_TRANSACTION_OK,
  LaWalletTags.OUTBOUND_TRANSACTION_ERROR,
  LaWalletTags.INBOUND_TRANSACTION_OK,
  LaWalletTags.INBOUND_TRANSACTION_ERROR,
];

let intervalGenerateTransactions: NodeJS.Timeout;

const defaultActivity = {
  loading: true,
  lastCached: 0,
  cached: [],
  subscription: [],
  idsLoaded: [],
};

export const useActivity = (parameters: UseActivityProps): UseActivityReturns => {
  const { pubkey, enabled = true, limit = 1000, since = undefined, until = undefined, storage = false } = parameters;
  const config = useConfig(parameters);

  const [activityInfo, setActivityInfo] = React.useState<ActivityType>(defaultActivity);

  const { events: walletEvents } = useSubscription({
    filters: [
      {
        authors: [pubkey],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
        since: storage ? activityInfo.lastCached : since,
        until: until,
        limit: limit * 2,
      },
      {
        '#p': [pubkey],
        '#t': startTags,
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since: storage ? activityInfo.lastCached : since,
        until: until,
        limit: limit * 2,
      },
      {
        authors: [config.modulePubkeys.ledger],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#p': [pubkey],
        '#t': statusTags,
        since: storage ? activityInfo.lastCached : since,
        until: until,
        limit: limit * 2,
      },
    ],
    options,
    enabled: enabled && !activityInfo.loading,
  });

  const formatStartTransaction = async (event: NDKEvent) => {
    const nostrEvent: NostrEvent = await event.toNostrEvent();
    const AuthorIsCard: boolean = event.pubkey === config.modulePubkeys.card;

    const DelegatorIsUser: boolean = AuthorIsCard && nip26.getDelegator(nostrEvent as Event) === pubkey;
    const AuthorIsUser: boolean = DelegatorIsUser || event.pubkey === pubkey;

    if (AuthorIsCard && !DelegatorIsUser) {
      const delegation_pTags: string[] = getMultipleTags(event.tags, 'p');
      if (!delegation_pTags.includes(pubkey)) return;
    }

    const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

    const eventContent = parseContent(event.content);

    const newTransaction: Transaction = {
      id: event.id!,
      status: TransactionStatus.PENDING,
      memo: eventContent.memo ?? '',
      direction,
      type: AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL,
      tokens: eventContent.tokens,
      events: [nostrEvent],
      errors: [],
      createdAt: event.created_at! * 1000,
    };

    if (!AuthorIsCard) {
      const boltTag: string | undefined = getTag(event.tags, 'bolt11');
      if (boltTag && boltTag.length) newTransaction.type = TransactionType.LN;
    }

    return newTransaction;
  };

  const markTxRefund = async (transaction: Transaction, statusEvent: NDKEvent) => {
    const parsedContent = parseContent(statusEvent.content);
    transaction.status = TransactionStatus.REVERTED;
    transaction.errors = [parsedContent?.memo];
    transaction.events.push(await statusEvent.toNostrEvent());

    return transaction;
  };

  const updateTxStatus = async (transaction: Transaction, statusEvent: NDKEvent) => {
    const parsedContent = parseContent(statusEvent.content);

    const statusTag: string | undefined = getTag(statusEvent.tags, 't');

    if (statusTag) {
      const isError: boolean = statusTag.includes('error');

      if (transaction.direction === TransactionDirection.INCOMING && statusTag.includes('inbound'))
        transaction.type = TransactionType.LN;

      transaction.status = isError ? TransactionStatus.ERROR : TransactionStatus.CONFIRMED;

      if (isError) transaction.errors = [parsedContent];
      transaction.events.push(await statusEvent.toNostrEvent());
    }

    return transaction;
  };

  const findAsocciatedEvent = React.useCallback((events: NDKEvent[], eventId: string) => {
    return events.find((event) => {
      const associatedEvents: string[] = getMultipleTags(event.tags, 'e');
      return associatedEvents.includes(eventId) ? event : undefined;
    });
  }, []);

  const filterEventsByTxType = (events: NDKEvent[]) => {
    const startedEvents: NDKEvent[] = [],
      statusEvents: NDKEvent[] = [],
      refundEvents: NDKEvent[] = [];

    events.forEach((e) => {
      const subkind: string | undefined = getTag(e.tags, 't');
      if (subkind) {
        const isStatusEvent: boolean = statusTags.includes(subkind);

        if (isStatusEvent) {
          statusEvents.push(e);
          return;
        } else {
          const eTags: string[] = getMultipleTags(e.tags, 'e');

          if (eTags.length) {
            const isRefundEvent = events.find((event) => eTags.includes(event.id));
            isRefundEvent ? refundEvents.push(e) : startedEvents.push(e);
            return;
          } else {
            const existTransaction: boolean = Boolean(startedEvents.find((startEvent) => startEvent.id === e.id));

            if (!existTransaction) startedEvents.push(e);
            return;
          }
        }
      }
    });

    return [startedEvents, statusEvents, refundEvents];
  };

  async function generateTransactions(events: NDKEvent[]) {
    const transactions: Transaction[] = [];
    const [startedEvents, statusEvents, refundEvents] = filterEventsByTxType(events);

    setActivityInfo((prev) => {
      return {
        ...prev,
        idsLoaded: transactions.map((tx) => tx.id.toString()),
        loading: true,
      };
    });

    startedEvents!.forEach((startEvent) => {
      formatStartTransaction(startEvent)
        .then((formattedTx) => {
          if (!formattedTx) return;
          if (!statusEvents) return formattedTx;

          const statusEvent: NDKEvent | undefined = findAsocciatedEvent(statusEvents, startEvent.id!);

          if (!statusEvent) return formattedTx;
          return updateTxStatus(formattedTx, statusEvent);
        })
        .then((formattedTx) => {
          if (!formattedTx) return;
          if (!refundEvents) return formattedTx;

          const refundEvent: NDKEvent | undefined = findAsocciatedEvent(refundEvents, startEvent.id!);

          if (!refundEvent) return formattedTx;

          const statusRefundEvent: NDKEvent | undefined = findAsocciatedEvent(refundEvents, refundEvent.id!);
          return markTxRefund(formattedTx, statusRefundEvent || refundEvent);
        })
        .then((transaction: Transaction | undefined) => {
          if (!transaction) return;

          transactions.push(transaction);
        });
    });

    setActivityInfo((prev) => {
      return {
        ...prev,
        subscription: transactions,
        loading: false,
      };
    });
  }

  const loadCachedTransactions = () => {
    if (pubkey.length) {
      const storagedData: string = (config.storage.getItem(`${CACHE_TXS_KEY}_${pubkey}`) as string) || '';

      if (!storage || !storagedData) {
        setActivityInfo({ ...defaultActivity, loading: false });
        return;
      }

      const cachedTxs: Transaction[] = parseContent(storagedData);

      if (cachedTxs.length) {
        const lastCached: number = cachedTxs.length
          ? 1 + cachedTxs[0]!.events[cachedTxs[0]!.events.length - 1]!.created_at
          : 0;

        setActivityInfo({
          subscription: [],
          idsLoaded: cachedTxs.map((tx) => tx.id.toString()),
          cached: cachedTxs,
          lastCached,
          loading: false,
        });
      }
    }
  };

  const transactions: Transaction[] = React.useMemo(() => {
    if (!storage) return activityInfo.subscription.sort((a, b) => b.createdAt - a.createdAt);

    const TXsWithoutCached: Transaction[] = activityInfo.subscription.filter((tx) => {
      const cached = activityInfo.cached.find((cachedTX) => cachedTX.id === tx.id);

      return Boolean(!cached);
    });

    return [...TXsWithoutCached, ...activityInfo.cached].sort((a, b) => b.createdAt - a.createdAt);
  }, [activityInfo]);

  React.useEffect(() => {
    if (walletEvents.length) {
      if (intervalGenerateTransactions) clearTimeout(intervalGenerateTransactions);

      intervalGenerateTransactions = setTimeout(() => generateTransactions(walletEvents), 350);
    }

    return () => clearTimeout(intervalGenerateTransactions);
  }, [walletEvents]);

  React.useEffect(() => {
    loadCachedTransactions();
  }, [pubkey]);

  React.useEffect(() => {
    if (storage && transactions.length)
      config.storage.setItem(`${CACHE_TXS_KEY}_${pubkey}`, JSON.stringify(transactions));
  }, [transactions]);

  return {
    transactions,
  };
};
