import {
  LaWalletKinds,
  LaWalletTags,
  getMultipleTagsValues,
  getTag,
  getTagValue,
  nip26,
  nowInSeconds,
  parseContent,
} from '@lawallet/utils';
import type { ConfigParameter, ConfigProps } from '@lawallet/utils/types';
import { TransactionDirection, TransactionStatus, TransactionType, type Transaction } from '@lawallet/utils/types';
import NDK, { NDKEvent, type NDKFilter, type NDKKind, type NDKSubscriptionOptions, type NostrEvent } from '@nostr-dev-kit/ndk';
import { type Event } from 'nostr-tools';
import * as React from 'react';
import { CACHE_TXS_EVENTS_KEY } from '../constants/constants.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useConfig } from './useConfig.js';
import { useSubscription } from './useSubscription.js';
import { useNostr } from '../context/NostrContext.js';

export interface ActivitySubscriptionProps {
  pubkey: string;
}

export type ActivityType = {
  loading: boolean;
  cache: {
    loaded: boolean;
    lastCached: number;
  }
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

export const options: NDKSubscriptionOptions = {
  groupable: true,
  closeOnEose: false,
};

const statusTags: string[] = [
  LaWalletTags.INTERNAL_TRANSACTION_OK,
  LaWalletTags.INTERNAL_TRANSACTION_ERROR,
  LaWalletTags.OUTBOUND_TRANSACTION_OK,
  LaWalletTags.OUTBOUND_TRANSACTION_ERROR,
  LaWalletTags.INBOUND_TRANSACTION_OK,
  LaWalletTags.INBOUND_TRANSACTION_ERROR,
];

const MAX_TRANSACTIONS_TIME: number = 180 * (24 * 60 * 60);
const MAX_CACHED_EVENTS: number = 400;

const defaultActivity = {
  loading: true,
  cache: {
    loaded: false,
    lastCached: nowInSeconds() - MAX_TRANSACTIONS_TIME,
  },
  transactions: [],
};

type EventWithStatus = {
  startEvent: NostrEvent,
  statusEvent: NostrEvent | undefined
}

type TransactionEvents = {
  transaction: EventWithStatus;
  outbound?: EventWithStatus;
  refund?: EventWithStatus;
};

type ClassifiedEvents = {
  started: NostrEvent[];
  outboundStart: NostrEvent[];
  status: NostrEvent[];
  refund: NostrEvent[];
}

let debounceTimeout: NodeJS.Timeout;

export type UseActivityReturns = {
  transactions: Transaction[];
  loading: boolean;
};

async function resolveMissingOutboundEvents({
  missingIds,
  ndk,
  config,
}: {
  missingIds: string[];
  ndk: NDK;
  config: ConfigProps;
}): Promise<{
  outboundStart: NostrEvent[];
  outboundStatus: NostrEvent[];
}> {
  if (!missingIds.length) return { outboundStart: [], outboundStatus: [] };

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

  const chunked = chunk(missingIds, 20);

  const filters = [
    ...chunked.map(chunkIds => ({
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      authors: [config.modulePubkeys.urlx],
      '#t': [LaWalletTags.OUTBOUND_TRANSACTION_START],
      '#e': chunkIds,
    })),
    ...chunked.map(chunkIds => ({
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      authors: [config.modulePubkeys.ledger],
      '#t': [LaWalletTags.OUTBOUND_TRANSACTION_OK, LaWalletTags.OUTBOUND_TRANSACTION_ERROR],
      '#e': chunkIds,
    })),
  ];

  const fetched = await ndk.fetchEvents(filters);
  const outboundStart: NostrEvent[] = [];
  const outboundStatus: NostrEvent[] = [];

  await Promise.all(
    Array.from(fetched).map(async e => {
      const tag = getTagValue(e.tags, 't');
      const parsed = await e.toNostrEvent();

      if (tag === LaWalletTags.OUTBOUND_TRANSACTION_START) {
        outboundStart.push(parsed);
      } else if (
        tag === LaWalletTags.OUTBOUND_TRANSACTION_OK ||
        tag === LaWalletTags.OUTBOUND_TRANSACTION_ERROR
      ) {
        outboundStatus.push(parsed);
      }
    })
  );

  return { outboundStart, outboundStatus };
}


export const useActivity = (parameters?: UseActivityProps): UseActivityReturns => {
  if (!parameters) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.activity;
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
  const [cachedEvents, setCachedEvents] = React.useState<NostrEvent[]>([]);

  const since = React.useMemo(() => {
    if (sinceParam) return sinceParam;
    if (!sinceParam && !activityInfo.cache.lastCached) return nowInSeconds() - MAX_TRANSACTIONS_TIME;

    return activityInfo.cache.lastCached;
  }, [sinceParam, activityInfo]);

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
        '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since,
        until: until,
        limit: limit * 2,
      },
      {
        authors: [config.modulePubkeys.urlx],
        '#p': [pubkey],
        '#t': [LaWalletTags.INBOUND_TRANSACTION_START],
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
    [enabled, pubkey, since, activityInfo, storage, until, limit, config],
  );

  const { events: txsEvents } = useSubscription({
    filters,
    options,
    enabled: enabled && activityInfo.cache.loaded,
    config,
  });
  
  const { ndk, decrypt } = useNostr();

  const transactions: Transaction[] = React.useMemo(() => {    
    return activityInfo.transactions.sort((a, b) => b.createdAt - a.createdAt);
  }, [activityInfo.transactions.length]);

  const formatStartTransaction = React.useCallback(
    async (event: NostrEvent) => {
      const pTagValues = getMultipleTagsValues(event.tags, 'p');
      if (!pTagValues.includes(config.modulePubkeys.ledger)) return;

      const AuthorIsCard: boolean = event.pubkey === config.modulePubkeys.card;

      const DelegatorIsUser: boolean = AuthorIsCard && nip26.getDelegator(event as Event) === pubkey;
      const AuthorIsUser: boolean = DelegatorIsUser || event.pubkey === pubkey;

      if (AuthorIsCard && !DelegatorIsUser && !pTagValues.includes(pubkey)) return;

      const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

      const eventContent = parseContent(event.content);
      const metadata = getTag(event.tags, 'metadata');

      let tmpTransaction: Transaction = {
        id: event.id!,
        status: TransactionStatus.PENDING,
        memo: eventContent.memo ?? '',
        direction,
        type: AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL,
        tokens: eventContent.tokens,
        events: [event],
        errors: [],
        createdAt: event.created_at! * 1000,
        metadata,
      };

      if (!AuthorIsCard) {
        const boltTag: string | undefined = getTagValue(event.tags, 'bolt11');
        if (boltTag && boltTag.length) tmpTransaction.type = TransactionType.LN;
      }

      return tmpTransaction;
    },
    [ndk, pubkey],
  );

  const markTxRefund = async (transaction: Transaction, refundData: EventWithStatus) => {
    if (!refundData.statusEvent) return transaction;

    const { startEvent, statusEvent} = refundData;
    transaction.status = TransactionStatus.REVERTED;

    
    const parsedContent = parseContent(statusEvent.content);
    transaction.memo = parsedContent?.memo;
    transaction.errors.push(parsedContent?.memo)
    
    transaction.events.push(...[startEvent, statusEvent])

    return transaction;
  };

  const updateTxInfo = React.useCallback(async (tx: Transaction, txEvents: TransactionEvents) => {
    if (!txEvents) return tx;

    const { transaction, outbound, refund } = txEvents;
    if (!transaction.statusEvent) return tx;

    const addTxStatus = (tmpTx: Transaction, statusEvent: NostrEvent) => {
      const statusTag: string | undefined = getTagValue(statusEvent.tags, 't');
      if (!statusTag) return tx;

      tmpTx.events.push(statusEvent);

      const isConfirmed: boolean = statusTag === LaWalletTags.INTERNAL_TRANSACTION_OK || statusTag === LaWalletTags.OUTBOUND_TRANSACTION_OK || statusTag === LaWalletTags.INBOUND_TRANSACTION_OK;
      if (isConfirmed) {
        tmpTx.status = TransactionStatus.CONFIRMED;
        return tmpTx;
      } 

      const isError: boolean = statusTag === LaWalletTags.INTERNAL_TRANSACTION_ERROR || statusTag === LaWalletTags.OUTBOUND_TRANSACTION_ERROR || statusTag === LaWalletTags.INBOUND_TRANSACTION_ERROR;
      if (isError) {
        tmpTx.status = TransactionStatus.ERROR;

        const parsedContent = parseContent(statusEvent.content);
        if (parsedContent && parsedContent.messages && parsedContent.messages.length) {
          tmpTx.memo = parsedContent.messages[0];
          tmpTx.errors = parsedContent.messages;
        }
      }

      return tmpTx;
    }

    tx = addTxStatus(tx, transaction.statusEvent)
    let isOutbound: boolean = Boolean(tx.direction === TransactionDirection.OUTGOING && tx.type === TransactionType.LN);

    if (isOutbound) {
      if (!outbound || !outbound.startEvent || !outbound.statusEvent) {
        tx.status = TransactionStatus.PENDING;
      } else {
        tx.events.push(outbound.startEvent);

        let encryptedPreimage = getTagValue(outbound.startEvent.tags, 'preimage');

        if (encryptedPreimage) {
          let decryptedPreimage = await decrypt(config.modulePubkeys.urlx, encryptedPreimage);
          if (decryptedPreimage) tx.preimage = decryptedPreimage;
        }

        tx = addTxStatus(tx, outbound.statusEvent);
      }
    }

    if (refund && refund.startEvent.id) return markTxRefund(tx, refund)
    return tx;
  }, [decrypt]);

  const findAsocciatedEvent = React.useCallback((events: NostrEvent[] | undefined, eventId?: string) => {
    if (!events || !events.length || !eventId) return;
    
    return events.find((event) => {
      const associatedEvents: string[] = getMultipleTagsValues(event.tags, 'e');
      return associatedEvents.includes(eventId) ? event : undefined;
    });
  }, []);

  const classificateTxEvents = React.useCallback(async (events: NostrEvent[]): Promise<ClassifiedEvents> => {
    const startedEvents: NostrEvent[] = [],
      outboundStartEvents: NostrEvent[] = [],
      statusEvents: NostrEvent[] = [],
      refundEvents: NostrEvent[] = [];

    let missingOutboundEventIds = [];

    for (const event of events) {
      const subkind: string | undefined = getTagValue(event.tags, 't');
      if (!subkind) continue;
      
      const isStatusEvent: boolean = statusTags.includes(subkind);

      if (isStatusEvent) {
        statusEvents.push(event);
        continue;
      }
      
      const tagEvents: string[] = getMultipleTagsValues(event.tags, 'e');
      
      const isRefundEvent =
          event.pubkey === config.modulePubkeys.urlx && subkind === LaWalletTags.INTERNAL_TRANSACTION_START && Boolean(events.find((e) => tagEvents.includes(e.id!)));

      if (isRefundEvent) {
        refundEvents.push(event);
        continue;
      } 

      const existTransaction: boolean = Boolean(startedEvents.find((startEvent) => startEvent.id === event.id));
      if (existTransaction) continue;

      if (subkind === LaWalletTags.OUTBOUND_TRANSACTION_START) {
        outboundStartEvents.push(event)
      } else {
        startedEvents.push(event);
      }

      let boltTag = getTagValue(event.tags, 'bolt11');
      if (boltTag && event.pubkey === pubkey) {
        const hasRefund = events.find((e) => {
          let subkind = getTagValue(e.tags, 't');
          let associatedEvents = getMultipleTagsValues(e.tags, 'e');

          return (e.pubkey === config.modulePubkeys.urlx && subkind === LaWalletTags.INTERNAL_TRANSACTION_START && associatedEvents.includes(event.id!));
        })

        if (hasRefund) continue;

        const hasOutboundStart = events.find((e) => {
          let subkind = getTagValue(e.tags, 't');
          let associatedEvents = getMultipleTagsValues(e.tags, 'e');

          return (subkind === LaWalletTags.OUTBOUND_TRANSACTION_START && associatedEvents.includes(event.id!));
        })

        if (!hasOutboundStart) {
          missingOutboundEventIds.push(event.id!);
          continue;
        } 
        
        const hasOutboundStatus = events.find((e) => {
          let subkind = getTagValue(e.tags, 't');
          let associatedEvents = getMultipleTagsValues(e.tags, 'e');

          return ((subkind === LaWalletTags.OUTBOUND_TRANSACTION_ERROR || subkind === LaWalletTags.OUTBOUND_TRANSACTION_OK) && associatedEvents.includes(event.id!) && associatedEvents.includes(hasOutboundStart.id!));
        })

        if (!hasOutboundStatus) {
          missingOutboundEventIds.push(event.id!);
          continue;
        }

        outboundStartEvents.push(hasOutboundStart)
        statusEvents.push((hasOutboundStatus))
      }
    };

    if (missingOutboundEventIds.length) {
      const { outboundStart, outboundStatus } = await resolveMissingOutboundEvents({
        missingIds: missingOutboundEventIds,
        ndk,
        config,
      });

      outboundStartEvents.push(...outboundStart);
      statusEvents.push(...outboundStatus);
    }

    return {started: startedEvents, outboundStart: outboundStartEvents, status: statusEvents, refund: refundEvents};
  }, [ndk, config, pubkey]);

  function parseStatusEvents(
    startEvent: NostrEvent,
    outboundStartEvents?: NostrEvent[],
    statusEvents?: NostrEvent[],
    refundEvents?: NostrEvent[],
  ): TransactionEvents {
    let txEvents: TransactionEvents = {
      transaction: {
        startEvent,
        statusEvent: findAsocciatedEvent(statusEvents, startEvent.id!),
      },
    }

    const startAssociatedOutbound: NostrEvent | undefined = findAsocciatedEvent(outboundStartEvents, startEvent.id)
    const outboundStatusEvent = findAsocciatedEvent(statusEvents, startAssociatedOutbound?.id)

    if (startAssociatedOutbound && startAssociatedOutbound.id) {
      txEvents.outbound = {
        startEvent: startAssociatedOutbound,
        statusEvent: outboundStatusEvent
      }
    }
    
    const startAssociatedRefund: NostrEvent | undefined = findAsocciatedEvent(refundEvents, startEvent.id)
    const refundStatus: NostrEvent | undefined = findAsocciatedEvent(statusEvents, startAssociatedRefund?.id);

    if (startAssociatedRefund && startAssociatedRefund.id) {
      txEvents.refund = {
        startEvent: startAssociatedRefund,
        statusEvent: refundStatus,
      };
    }

    return txEvents;
  }

  async function fillTransaction(txEvents: TransactionEvents) {
    if (!txEvents || !txEvents.transaction) return;

    const { transaction } = txEvents;

    let tmpTransaction: Transaction | undefined = await formatStartTransaction(transaction.startEvent);
    if (!tmpTransaction) return;

    return updateTxInfo(tmpTransaction, txEvents);
  }

  const generateTransactions = React.useCallback(
    async (events: NostrEvent[]) => {
      if (!pubkey.length) return;

      let txs: Transaction[] = [];
      const { started, outboundStart, status, refund } = await classificateTxEvents(events);
      if (!started?.length) return;

      for (const startEvent of started) {
        const transactionEvents = parseStatusEvents(startEvent, outboundStart, status, refund);
        if (!transactionEvents) return;
        
        const transaction = await fillTransaction(transactionEvents);
        if (transaction) txs.push(transaction);
      }

      setActivityInfo((prev) => {
        return {
          ...prev,
          transactions: txs,
          loading: false,
        };
      });

      const eventsToCache = [
        ...(started || []),
        ...(outboundStart || []),
        ...(status || []),
        ...(refund || [])
      ];

      if (storage) saveEventsOnCache(eventsToCache)
    },
    [storage, activityInfo, pubkey, cachedEvents],
  );

  const loadCachedTransactions = React.useCallback(async () => {
    if (pubkey.length) {
      const storagedData: string = ((await config.storage.getItem(`${CACHE_TXS_EVENTS_KEY}_${pubkey}`)) as string) || '';

      if (!storage || !storagedData) {
        setActivityInfo({ ...defaultActivity, cache: { loaded: true, lastCached: 0 } });
        return;
      }

      const cachedEvents: NostrEvent[] = parseContent(storagedData);
      if (cachedEvents.length) {
        const lastTX = cachedEvents[0];
        const sinceDefault = nowInSeconds() - MAX_TRANSACTIONS_TIME;
        const sinceLastCached = lastTX?.created_at ?? sinceDefault;

        setActivityInfo((prev) => ({
          ...prev,
          cache: {
            loaded: true,
            lastCached: sinceLastCached - 3600,
          },
        }));

        setCachedEvents(cachedEvents);
        debouncedGenerateTransactions(cachedEvents);
      }
    }
  }, [storage, pubkey]);

  const saveEventsOnCache = React.useCallback(
    async (events: NostrEvent[]) => {
      if (!events.length) return;

      let filteredTXs = events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, MAX_CACHED_EVENTS)
      await config.storage.setItem(`${CACHE_TXS_EVENTS_KEY}_${pubkey}`, JSON.stringify(filteredTXs));
    },
    [pubkey],
  );

  const debouncedGenerateTransactions = React.useCallback(
    async (events: NostrEvent[]) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        generateTransactions(events);
      }, 350);
    },
    [debounceTimeout],
  );

  const handleReceivedEvent = React.useCallback(async (events: NDKEvent[]) => {
    setActivityInfo((prev) => {
      return { ...prev, loading: true };
    });

    const nostrEvents: NostrEvent[] = await Promise.all(
      events.map(async (event) => {
        const nEvent = await event.toNostrEvent();
        return nEvent;
      }),
    );

    const combinedEvents = [...cachedEvents, ...nostrEvents];
    const uniqueEventsMap = new Map<string, NostrEvent>();

    combinedEvents.forEach((event) => {
      uniqueEventsMap.set(event.id!, event);
    });

    const uniqueEvents: NostrEvent[] = Array.from(uniqueEventsMap.values());
    debouncedGenerateTransactions(uniqueEvents)
  }, [cachedEvents, activityInfo])

  React.useEffect(() => {
    if (!pubkey) return;
    if (txsEvents.length) handleReceivedEvent(txsEvents);

    return () => clearTimeout(debounceTimeout);
  }, [pubkey, txsEvents.length]);

  React.useEffect(() => {
    if (!pubkey) {
      setActivityInfo(defaultActivity);
      setCachedEvents([])
      return;
    }

    storage
      ? loadCachedTransactions()
      : setActivityInfo((prev) => {
          return {
            ...prev,
            cache: {
              loaded: true,
              lastCached: 0,
            },
          };
        });
  }, [pubkey, storage]);

  return {
    transactions,
    loading: activityInfo.loading,
  };
};
