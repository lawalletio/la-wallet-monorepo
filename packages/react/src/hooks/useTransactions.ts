import {
  nip26,
  LaWalletKinds,
  LaWalletTags,
  getMultipleTagsValues,
  getTag,
  getTagValue,
  nowInSeconds,
  parseContent,
} from '@lawallet/utils';
import { TransactionDirection, TransactionStatus, TransactionType, type Transaction } from '@lawallet/utils/types';
import { type NDKEvent, type NDKKind, type NDKSubscriptionOptions, type NostrEvent } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import type { ConfigParameter } from '@lawallet/utils/types';
import { type Event } from 'nostr-tools';
import { CACHE_TXS_KEY } from '../constants/constants.js';
import { useNostr } from '../context/NostrContext.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useConfig } from './useConfig.js';
import { useSubscription } from './useSubscription.js';

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

export interface UseTransactionsProps extends ConfigParameter {
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

const MAX_TRANSACTIONS_TIME: number = 30 * (24 * 60 * 60); // 30 days

const defaultActivity = {
  loading: true,
  lastCached: nowInSeconds() - MAX_TRANSACTIONS_TIME,
  cached: [],
  subscription: [],
  idsLoaded: [],
};

type EventWithStatus = {
  startEvent: NDKEvent | undefined;
  statusEvent: NDKEvent | undefined;
};

let debounceTimeout: NodeJS.Timeout;

export const useTransactions = (parameters?: UseTransactionsProps): Transaction[] => {
  if (!parameters) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.transactions;
  }

  const {
    pubkey,
    enabled = true,
    limit = 1000,
    since: sinceParam = undefined,
    until = undefined,
    storage = false,
  } = parameters;
  const config = useConfig(parameters);

  const [activityInfo, setActivityInfo] = React.useState<ActivityType>(defaultActivity);

  const since = React.useMemo(() => {
    if (sinceParam) return sinceParam;

    if (!sinceParam && !activityInfo.lastCached) return nowInSeconds() - MAX_TRANSACTIONS_TIME;
    return activityInfo.lastCached;
  }, [sinceParam, activityInfo]);

  const { decrypt } = useNostr();

  const filters = React.useMemo(
    () => [
      {
        authors: [pubkey],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
        since,
        until: until,
        limit: limit * 2,
      },
      {
        '#p': [pubkey],
        '#t': startTags,
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since,
        until: until,
        limit: limit * 2,
      },
      {
        authors: [config.modulePubkeys.ledger],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        '#p': [pubkey],
        '#t': statusTags,
        since,
        until: until,
        limit: limit * 2,
      },
    ],
    [pubkey, since, activityInfo, storage, until, limit, config],
  );

  const { events: walletEvents } = useSubscription({
    filters,
    options,
    enabled: enabled && !activityInfo.loading,
    config,
  });

  const extractMetadata = async (event: NostrEvent, direction: TransactionDirection) => {
    try {
      const metadataTag = getTag(event.tags, 'metadata');
      if (metadataTag && metadataTag.length === 4) {
        const [, encrypted, encrpytType, message] = metadataTag;

        if (!encrypted) return parseContent(message!);

        if (encrpytType === 'nip04') {
          const decryptPubkey: string =
            direction === TransactionDirection.INCOMING ? event.pubkey : getMultipleTagsValues(event.tags, 'p')[1]!;

          const decryptedMessage = await decrypt(decryptPubkey, message!);
          return parseContent(decryptedMessage);
        }
      }
    } catch {
      return {};
    }
  };

  const formatStartTransaction = async (event: NDKEvent) => {
    const nostrEvent: NostrEvent = await event.toNostrEvent();
    const AuthorIsCard: boolean = event.pubkey === config.modulePubkeys.card;

    const DelegatorIsUser: boolean = AuthorIsCard && nip26.getDelegator(nostrEvent as Event) === pubkey;
    const AuthorIsUser: boolean = DelegatorIsUser || event.pubkey === pubkey;

    if (AuthorIsCard && !DelegatorIsUser) {
      const delegation_pTags: string[] = getMultipleTagsValues(event.tags, 'p');
      if (!delegation_pTags.includes(pubkey)) return;
    }

    const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

    const eventContent = parseContent(event.content);
    const metadata = await extractMetadata(nostrEvent, direction);

    let newTransaction: Transaction = {
      id: event.id!,
      status: TransactionStatus.PENDING,
      memo: eventContent.memo ?? '',
      direction,
      type: AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL,
      tokens: eventContent.tokens,
      events: [nostrEvent],
      errors: [],
      createdAt: event.created_at! * 1000,
      metadata,
    };

    if (!AuthorIsCard) {
      const boltTag: string | undefined = getTagValue(event.tags, 'bolt11');
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

    const statusTag: string | undefined = getTagValue(statusEvent.tags, 't');

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
      const associatedEvents: string[] = getMultipleTagsValues(event.tags, 'e');
      return associatedEvents.includes(eventId) ? event : undefined;
    });
  }, []);

  const filterEventsByTxType = (events: NDKEvent[]) => {
    const startedEvents: NDKEvent[] = [],
      statusEvents: NDKEvent[] = [],
      refundEvents: NDKEvent[] = [];

    events.forEach((e) => {
      const subkind: string | undefined = getTagValue(e.tags, 't');
      if (subkind) {
        const isStatusEvent: boolean = statusTags.includes(subkind);

        if (isStatusEvent) {
          statusEvents.push(e);
          return;
        } else {
          const eTags: string[] = getMultipleTagsValues(e.tags, 'e');

          if (eTags.length) {
            const isRefundEvent =
              e.author.pubkey === config.modulePubkeys.urlx &&
              Boolean(events.find((event) => eTags.includes(event.id)));
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

  function parseStatusEvents(
    startEvent: NDKEvent,
    statusEvents?: NDKEvent[],
    refundEvents?: NDKEvent[],
  ): EventWithStatus[] {
    const statusEvent: NDKEvent | undefined = statusEvents
      ? findAsocciatedEvent(statusEvents, startEvent.id!)
      : undefined;

    const startRefundEvent: NDKEvent | undefined = refundEvents
      ? findAsocciatedEvent(refundEvents, startEvent.id!)
      : undefined;

    const statusRefundEvent: NDKEvent | undefined =
      startRefundEvent && refundEvents ? findAsocciatedEvent(refundEvents, startRefundEvent.id!) : undefined;

    const startWithStatus: EventWithStatus = {
      startEvent,
      statusEvent,
    };

    const refundWithStatus: EventWithStatus = {
      startEvent: startRefundEvent,
      statusEvent: statusRefundEvent,
    };

    return [startWithStatus, refundWithStatus];
  }

  async function fillTransaction(txEvents: EventWithStatus, refundEvents: EventWithStatus) {
    let tmpTransaction: Transaction | undefined = await formatStartTransaction(txEvents.startEvent!);
    if (!tmpTransaction) return;

    if (txEvents.statusEvent) tmpTransaction = await updateTxStatus(tmpTransaction, txEvents.statusEvent);

    if (refundEvents.startEvent)
      tmpTransaction = await markTxRefund(tmpTransaction, refundEvents.statusEvent || refundEvents.startEvent);

    return tmpTransaction;
  }

  async function generateTransactions(events: NDKEvent[]) {
    const transactions: Transaction[] = [];
    const [startedEvents, statusEvents, refundEvents] = filterEventsByTxType(events);

    setActivityInfo((prev) => {
      return {
        ...prev,
        idsLoaded: transactions.map((tx) => tx.id.toString()),
      };
    });

    await Promise.all(
      startedEvents!.map(async (startEvent) => {
        const [startWithStatus, refundWithStatus] = parseStatusEvents(startEvent, statusEvents, refundEvents);
        const transaction = await fillTransaction(startWithStatus!, refundWithStatus!);
        if (transaction) transactions.push(transaction);
      }),
    );

    setActivityInfo((prev) => {
      return {
        ...prev,
        subscription: transactions,
        loading: false,
      };
    });
  }

  const saveCacheActivity = (txs: Transaction[]) => {
    let lastTx = txs[0];
    let sinceDefault = nowInSeconds() - MAX_TRANSACTIONS_TIME;
    let sinceLastCached = lastTx?.events[lastTx.events.length - 1]?.created_at ?? sinceDefault;

    setActivityInfo({
      subscription: [],
      idsLoaded: txs.map((tx) => tx.id.toString()),
      cached: txs,
      lastCached: sinceLastCached,
      loading: false,
    });
  };

  const loadCachedTransactions = async () => {
    if (pubkey.length) {
      const storagedData: string = ((await config.storage.getItem(`${CACHE_TXS_KEY}_${pubkey}`)) as string) || '';

      if (!storage || !storagedData) {
        setActivityInfo({ ...defaultActivity, loading: false });
        return;
      }

      const cachedTxs: Transaction[] = parseContent(storagedData);
      saveCacheActivity(cachedTxs);
    }
  };

  const transactions: Transaction[] = React.useMemo(() => {
    if (!storage) return activityInfo.subscription.sort((a, b) => b.createdAt - a.createdAt);

    const TXsWithoutCached: Transaction[] = activityInfo.subscription.filter((tx) => {
      const cached = activityInfo.cached.find((cachedTX) => cachedTX.id === tx.id);

      return Boolean(!cached);
    });

    return [...TXsWithoutCached, ...activityInfo.cached].sort((a, b) => b.createdAt - a.createdAt);
  }, [activityInfo.cached.length, activityInfo.subscription.length]);

  const debouncedGenerateTransactions = React.useCallback(
    (events: NDKEvent[]) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        generateTransactions(events);
      }, 300);
    },
    [debounceTimeout],
  );

  React.useEffect(() => {
    if (walletEvents.length) debouncedGenerateTransactions(walletEvents);
    return () => clearTimeout(debounceTimeout);
  }, [walletEvents.length]);

  React.useEffect(() => {
    if (!pubkey) {
      setActivityInfo(defaultActivity);
      return;
    }

    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => {
          return {
            ...prev,
            loading: false,
          };
        });
  }, [pubkey, storage]);

  const saveTransactions = async (txs: Transaction[]) => {
    await config.storage.setItem(`${CACHE_TXS_KEY}_${pubkey}`, JSON.stringify(txs));
    saveCacheActivity(txs);
  };

  React.useEffect(() => {
    if (storage && transactions.length) saveTransactions(transactions);
  }, [transactions.length]);

  return transactions;
};
