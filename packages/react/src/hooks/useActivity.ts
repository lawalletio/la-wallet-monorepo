import {
  LaWalletKinds,
  LaWalletTags,
  getMultipleTagsValues,
  getTag,
  getTagValue,
  nip26,
  nowInSeconds,
  parseContent,
  MappedStoragedKeys
} from '@lawallet/utils';
import type { ConfigParameter, ConfigProps } from '@lawallet/utils/types';
import { TransactionDirection, TransactionStatus, TransactionType, type Transaction } from '@lawallet/utils/types';
import NDK, { NDKEvent, type NDKKind, type NDKSubscriptionOptions, type NostrEvent } from '@nostr-dev-kit/ndk';
import { type Event } from 'nostr-tools';
import * as React from 'react';
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
    transactions: Transaction[],
    lastCached: number;
    loaded: boolean;
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
const MAX_CACHED_TXS: number = 200;

const defaultActivity = {
  loading: true,
  cache: {
    transactions: [],
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

const splitTransactionsForCache = (transactions: Transaction[]) => {
  const firstPendingIndex = transactions.findIndex(tx => tx.status === TransactionStatus.PENDING);

  if (firstPendingIndex === -1) return transactions.filter(tx => tx.status !== TransactionStatus.PENDING);

  return transactions
      .slice(0, firstPendingIndex)
      .filter(tx => tx.status !== TransactionStatus.PENDING);
};


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
    const combined = [...activityInfo.transactions, ...activityInfo.cache.transactions];
  
    const txMap = new Map<string, Transaction>();
    for (const tx of combined) {
      txMap.set(tx.id, tx);
    }
  
    return Array.from(txMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [activityInfo.transactions.length, activityInfo.cache.transactions.length]);

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

  const decryptPreimage = React.useCallback(async (outboundEvent: NostrEvent) => {
    const encryptedPreimage = getTagValue(outboundEvent.tags, 'preimage');
    if (!encryptedPreimage) return;

    return decrypt(config.modulePubkeys.urlx, encryptedPreimage);
  }, [config.modulePubkeys.urlx, decrypt])

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
        tx.preimage = await decryptPreimage(outbound.startEvent);

        tx = addTxStatus(tx, outbound.statusEvent);
      }
    }

    if (refund && refund.startEvent.id) return markTxRefund(tx, refund)
    return tx;
  }, [decryptPreimage]);

  const classificateTxEvents = React.useCallback(async (
    events: NostrEvent[]
  ): Promise<{ started: NostrEvent[]; referencedBy: Map<string, NostrEvent[]> }> => {
    const started: NostrEvent[] = [];
    const referencedBy = new Map<string, NostrEvent[]>();
    const byId = new Map<string, NostrEvent>();
    const missingOutboundEventIds: string[] = [];
  
    for (const event of events) {
      if (event.id) byId.set(event.id, event);
    }
  
    for (const event of events) {
      const subkind = getTagValue(event.tags, 't');
      if (!subkind || !event.id) continue;
  
      const references = getMultipleTagsValues(event.tags, 'e');
  
      const isRefund =
        subkind === LaWalletTags.INTERNAL_TRANSACTION_START &&
        event.pubkey === config.modulePubkeys.urlx &&
        references.some(refId => {
          const ref = byId.get(refId);
          return (
            ref &&
            ref.pubkey === pubkey &&
            getTagValue(ref.tags, 't') === LaWalletTags.INTERNAL_TRANSACTION_START
          );
        });
  
      const isReferencing =
        statusTags.includes(subkind) ||
        subkind === LaWalletTags.OUTBOUND_TRANSACTION_START ||
        isRefund;
  
      if (isReferencing) {
        for (const refId of references) {
          if (!referencedBy.has(refId)) referencedBy.set(refId, []);
          referencedBy.get(refId)!.push(event);
        }
      }

      if (subkind === LaWalletTags.INTERNAL_TRANSACTION_START && !isRefund) {
        started.push(event);
  
        const bolt11 = getTagValue(event.tags, 'bolt11');
        const isExternalOutgoing = bolt11 && event.pubkey === pubkey;
  
        if (isExternalOutgoing) {
          const outboundStart = referencedBy.get(event.id!)?.find(
            e => getTagValue(e.tags, 't') === LaWalletTags.OUTBOUND_TRANSACTION_START
          );
  
          if (!outboundStart) {
            missingOutboundEventIds.push(event.id!);
          } else {
            const outboundStatus = referencedBy.get(outboundStart.id!)?.find(e =>
              [LaWalletTags.OUTBOUND_TRANSACTION_OK, LaWalletTags.OUTBOUND_TRANSACTION_ERROR].includes(
                getTagValue(e.tags, 't') as LaWalletTags
              )
            );
  
            if (!outboundStatus) {
              missingOutboundEventIds.push(event.id!);
            }
          }
        }
      }
    }
  
    if (missingOutboundEventIds.length) {
      const { outboundStart, outboundStatus } = await resolveMissingOutboundEvents({
        missingIds: missingOutboundEventIds,
        ndk,
        config,
      });
  
      for (const event of [...outboundStart, ...outboundStatus]) {
        const refs = getMultipleTagsValues(event.tags, 'e');
        for (const refId of refs) {
          if (!referencedBy.has(refId)) referencedBy.set(refId, []);
          referencedBy.get(refId)!.push(event);
        }

        if (event.id) byId.set(event.id, event);
      }
    }
  
    return { started, referencedBy };
  }, [ndk, config, pubkey]);

  function parseTransactionEvents(
    startEvent: NostrEvent,
    referencedBy: Map<string, NostrEvent[]>,
    pubkey: string
  ): TransactionEvents {
    const refs = referencedBy.get(startEvent.id!) ?? [];

    const internalStatusTags = [LaWalletTags.INTERNAL_TRANSACTION_ERROR, LaWalletTags.INTERNAL_TRANSACTION_OK];
    const outboundStatusTags = [LaWalletTags.OUTBOUND_TRANSACTION_OK, LaWalletTags.OUTBOUND_TRANSACTION_ERROR];

    const statusEvent = refs.find(e =>
      internalStatusTags.includes(
        getTagValue(e.tags, 't') as LaWalletTags
      )
    );
  
    const refund = refs.find(e =>
      getTagValue(e.tags, 't') === LaWalletTags.INTERNAL_TRANSACTION_START &&
      e.pubkey === config.modulePubkeys.urlx && getMultipleTagsValues(e.tags, 'p').includes(pubkey)
    );
  
    const refundStatus = refund
      ? referencedBy.get(refund.id!)?.find(e =>
          internalStatusTags.includes(
            getTagValue(e.tags, 't') as LaWalletTags
          ) && getMultipleTagsValues(e.tags, 'p').includes(pubkey)
        )
      : undefined;
  
    const outboundStart = refs.find(e =>
      getTagValue(e.tags, 't') === LaWalletTags.OUTBOUND_TRANSACTION_START
    );
  
    const outboundStatus = outboundStart
      ? referencedBy.get(outboundStart.id!)?.find(e =>
          outboundStatusTags.includes(
            getTagValue(e.tags, 't') as LaWalletTags
          )
        )
      : undefined;
  
    const txEvents: TransactionEvents = {
      transaction: {
        startEvent,
        statusEvent,
      },
      ...(outboundStart && {
        outbound: {
          startEvent: outboundStart,
          statusEvent: outboundStatus,
        },
      }),
      ...(refund && {
        refund: {
          startEvent: refund,
          statusEvent: refundStatus,
        },
      }),
    };
  
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
    async (events: NDKEvent[]) => {
      if (!pubkey.length) return;

      const rawEvents = await Promise.all(events.map(e => e.toNostrEvent()));
      const { started, referencedBy } = await classificateTxEvents(rawEvents);
      if (!started?.length) return;
  
      const txs: Transaction[] = [];
  
      for (const startEvent of started) {
        const transactionEvents = parseTransactionEvents(startEvent, referencedBy, pubkey);
        const transaction = await fillTransaction(transactionEvents);
        if (transaction) txs.push(transaction);
      }
  
      setActivityInfo(prev => ({
        ...prev,
        transactions: txs,
        loading: false,
      }));
  
      if (storage) saveTransactionsOnCache([...activityInfo.cache.transactions, ...txs]);
    },
    [storage, activityInfo, pubkey]
  );

  const loadCachedTransactions = React.useCallback(async () => {
    if (pubkey.length) {
      const rawStoragedData: string = ((await config.storage.getItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`)) as string) || '';

      if (!storage || !rawStoragedData) {
        setActivityInfo({ ...defaultActivity, cache: { loaded: true, transactions: [], lastCached: 0 }, loading: false });
        return;
      }

      const cachedTxs: Transaction[] = JSON.parse(rawStoragedData);
      const transationsToCache = splitTransactionsForCache(cachedTxs);

      const lastCachedTime = Math.floor((transationsToCache[0]?.createdAt ?? nowInSeconds()) / 1000) - 3600;

      setActivityInfo(prev => ({
        ...prev,
        cache: {
          loaded: true,
          transactions: [...transationsToCache],
          lastCached: lastCachedTime,
        },
        loading: false,
      }));
    }
  }, [storage, pubkey]);

  const saveTransactionsOnCache = React.useCallback(
    async (transactions: Transaction[]) => {
      const transationsToCache = splitTransactionsForCache(transactions);
      const limited = transationsToCache.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_CACHED_TXS);
  
      await config.storage.setItem(`${MappedStoragedKeys.TxEvents}_${pubkey}`, JSON.stringify(limited));
    },
    [pubkey]
  );

  const debouncedHandleEvents = React.useCallback(
    async (events: NDKEvent[]) => {
      if (!events.length) return;
  
      const seenEventIds = new Set<string>();
      for (const tx of transactions) {
        for (const ev of tx.events) {
          seenEventIds.add(ev.id!);
        }
      }
  
      const rawEventIds = await Promise.all(events.map(e => e.id));
      const hasNew = rawEventIds.some(id => !seenEventIds.has(id));
  
      if (!hasNew) return;
  
      if (debounceTimeout) clearTimeout(debounceTimeout);
  
      setActivityInfo(prev => ({
        ...prev,
        loading: true,
      }));
  
      debounceTimeout = setTimeout(() => {
        generateTransactions(events);
      }, 350);
    },
    [transactions, generateTransactions]
  );

  React.useEffect(() => {
    if (!pubkey) return;
    if (txsEvents.length) debouncedHandleEvents(txsEvents)

    return () => clearTimeout(debounceTimeout);
  }, [pubkey, txsEvents.length]);

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
            cache: {
              transactions: [],
              lastCached: 0,
              loaded: true,
            },
          };
        });
  }, [pubkey, storage]);

  return {
    transactions,
    loading: activityInfo.loading || (storage && !activityInfo.cache.loaded),
  };
};
