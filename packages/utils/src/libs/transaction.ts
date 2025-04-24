import type NDK from '@nostr-dev-kit/ndk';
import type { NDKKind, NostrEvent } from '@nostr-dev-kit/ndk';
import { TransactionDirection, TransactionStatus, TransactionType, type Transaction } from '../types/transaction.js';
import type { ConfigProps } from '../types/config.js';
import { getMultipleTagsValues, getTag, getTagValue, LaWalletKinds } from '../utils/events.js';
import { normalizeLNDomain, parseContent } from '../utils/utilities.js';
import { getDelegator } from './nip26.js';
import type { Event } from 'nostr-tools';
import { baseConfig } from '../constants/constants.js';
import { getUsername } from '../interceptors/identity.js';


export type EventWithStatus = {
  startEvent: NostrEvent;
  statusEvent?: NostrEvent;
};

export const extractTxMetadata = async (
  event: NostrEvent,
  direction: TransactionDirection,
  decrypt: (senderPubkey: string, encryptedMessage: string) => Promise<string | undefined>,
  config: ConfigProps = baseConfig,
): Promise<Record<string, string>> => {
  try {
    const receiverPubkey = getMultipleTagsValues(event.tags, 'p')[1]!;
    const metadataTag = getTag(event.tags, 'metadata');

    let parsedMetadata: Record<string, string> = {};

    if (metadataTag && metadataTag.length === 4) {
      const [, encrypted, encryptType, message] = metadataTag;

      if (!encrypted) {
        parsedMetadata = parseContent(message!);
      } else if (encryptType === 'nip04') {
        const decryptWithPubkey = direction === TransactionDirection.INCOMING ? event.pubkey : receiverPubkey;
        const decrypted = await decrypt(decryptWithPubkey, message!);
        if (decrypted) {
          parsedMetadata = parseContent(decrypted) ?? {};
        }
      }
    }

    if (direction === TransactionDirection.OUTGOING && receiverPubkey !== config.modulePubkeys.urlx) {
      if (!parsedMetadata.receiver) {
        const receiverUsername = await getUsername(receiverPubkey, config);
        if (receiverUsername.length) {
          parsedMetadata.receiver = `${receiverUsername}@${normalizeLNDomain(config.endpoints.lightningDomain)}`;
        }
      }
    }

    if (
      direction === TransactionDirection.INCOMING &&
      event.pubkey !== config.modulePubkeys.urlx &&
      event.pubkey !== config.modulePubkeys.card
    ) {
      if (!parsedMetadata.sender) {
        const senderUsername = await getUsername(event.pubkey, config);
        if (senderUsername.length) {
          parsedMetadata.sender = `${senderUsername}@${normalizeLNDomain(config.endpoints.lightningDomain)}`;
        }
      }
    }

    return parsedMetadata;
  } catch {
    return {};
  }
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

  const chunk = <T>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

  const chunked = chunk(missingIds, 20);

  const filters = [
    ...chunked.map((chunkIds) => ({
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      authors: [config.modulePubkeys.urlx],
      '#t': [TransactionTags.OUTBOUND.start],
      '#e': chunkIds,
    })),
    ...chunked.map((chunkIds) => ({
      kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
      authors: [config.modulePubkeys.ledger],
      '#t': [TransactionTags.OUTBOUND.ok, TransactionTags.OUTBOUND.error],
      '#e': chunkIds,
    })),
  ];

  if (!filters.length) return { outboundStart: [], outboundStatus: [] }

  const fetched = await ndk.fetchEvents(filters, { groupable: false, closeOnEose: true });
  const outboundStart: NostrEvent[] = [];
  const outboundStatus: NostrEvent[] = [];

  await Promise.all(
    Array.from(fetched).map(async (e) => {
      const tag = getTagValue(e.tags, 't');
      const parsed = await e.toNostrEvent();

      if (tag === TransactionTags.OUTBOUND.start) {
        outboundStart.push(parsed);
      } else if (tag === TransactionTags.OUTBOUND.ok || tag === TransactionTags.OUTBOUND.error) {
        outboundStatus.push(parsed);
      }
    }),
  );

  return { outboundStart, outboundStatus };
}

export async function classificateTxEvents(
  events: NostrEvent[],
  pubkey: string,
  config: ConfigProps,
  ndk: NDK,
): Promise<{ started: NostrEvent[]; referencedBy: Map<string, NostrEvent[]> }> {
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
      subkind === TransactionTags.INTERNAL.start &&
      event.pubkey === config.modulePubkeys.urlx &&
      references.some((refId) => {
        const ref = byId.get(refId);
        return ref && ref.pubkey === pubkey && getTagValue(ref.tags, 't') === TransactionTags.INTERNAL.start;
      });

    const isReferencing =
      [
        TransactionTags.INTERNAL.ok,
        TransactionTags.INTERNAL.error,
        TransactionTags.OUTBOUND.ok,
        TransactionTags.OUTBOUND.error,
        TransactionTags.INBOUND.ok,
        TransactionTags.INBOUND.error,
        TransactionTags.OUTBOUND.start,
      ].includes(subkind) || isRefund;

    if (isReferencing) {
      for (const refId of references) {
        if (!referencedBy.has(refId)) referencedBy.set(refId, []);
        referencedBy.get(refId)!.push(event);
      }
    }

    if (subkind === TransactionTags.INTERNAL.start && !isRefund) {
      started.push(event);

      const bolt11 = getTagValue(event.tags, 'bolt11');
      const isExternalOutgoing = bolt11 && event.pubkey === pubkey;

      if (isExternalOutgoing) missingOutboundEventIds.push(event.id!);
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
}

export class TransactionTags {
  static INTERNAL = new TransactionTags('internal-transaction');
  static INBOUND = new TransactionTags('inbound-transaction');
  static OUTBOUND = new TransactionTags('outbound-transaction');

  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get start(): string {
    return `${this.name}-start`;
  }

  get ok(): string {
    return `${this.name}-ok`;
  }

  get error(): string {
    return `${this.name}-error`;
  }
}

export class TransactionParser {
  public readonly transaction: EventWithStatus;
  public readonly outbound?: EventWithStatus;
  public readonly refund?: EventWithStatus;

  constructor(
    public readonly startEvent: NostrEvent,
    private readonly relatedEvents: NostrEvent[],
    private readonly pubkey: string,
    private readonly config: ConfigProps,
    private readonly decrypt: (author: string, preimage: string) => Promise<string | undefined>,
  ) {
    const internalType = TransactionTags.INTERNAL;
    const outboundType = TransactionTags.OUTBOUND;

    this.transaction = {
      startEvent,
      statusEvent: this.findStatusEvent([internalType.ok, internalType.error]),
    };

    const outboundStart = this.relatedEvents.find(
      (e) => getTagValue(e.tags, 't') === outboundType.start,
    );

    if (outboundStart) {
      const outboundStatus = this.relatedEvents.find(
        (e) => [outboundType.ok, outboundType.error].includes(getTagValue(e.tags, 't')) &&
               getMultipleTagsValues(e.tags, 'e').includes(outboundStart.id!)
      );

      this.outbound = {
        startEvent: outboundStart,
        statusEvent: outboundStatus,
      };
    }

    const refundStart = this.relatedEvents.find(
      (e) => getTagValue(e.tags, 't') === internalType.start &&
             e.pubkey === this.config.modulePubkeys.urlx &&
             getMultipleTagsValues(e.tags, 'p').includes(this.pubkey),
    );

    if (refundStart) {
      const refundStatus = this.relatedEvents.find(
        (e) => [internalType.ok, internalType.error].includes(getTagValue(e.tags, 't')) &&
               getMultipleTagsValues(e.tags, 'e').includes(refundStart.id!)
      );

      this.refund = {
        startEvent: refundStart,
        statusEvent: refundStatus,
      };
    }
  }

  private findStatusEvent(tags: string[]): NostrEvent | undefined {
    return this.relatedEvents.find((e) => tags.includes(getTagValue(e.tags, 't')));
  }

  async toTransaction(): Promise<Transaction | undefined> {
    const pTagValues = getMultipleTagsValues(this.startEvent.tags, 'p');
    if (!pTagValues.includes(this.config.modulePubkeys.ledger)) return;

    const AuthorIsCard: boolean = this.startEvent.pubkey === this.config.modulePubkeys.card;
    const DelegatorIsUser: boolean = AuthorIsCard && getDelegator(this.startEvent as Event) === this.pubkey;
    const AuthorIsUser: boolean = DelegatorIsUser || this.startEvent.pubkey === this.pubkey;

    if (AuthorIsCard && !DelegatorIsUser && !pTagValues.includes(this.pubkey)) return;

    const direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

    const eventContent = parseContent(this.startEvent.content);
    const metadata = getTag(this.startEvent.tags, 'metadata');

    let tx: Transaction = {
      id: this.startEvent.id!,
      status: TransactionStatus.PENDING,
      memo: eventContent.memo ?? '',
      direction,
      type: AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL,
      tokens: eventContent.tokens,
      events: [this.startEvent],
      errors: [],
      createdAt: this.startEvent.created_at! * 1000,
      metadata,
    };

    if (!AuthorIsCard) {
      const boltTag: string | undefined = getTagValue(this.startEvent.tags, 'bolt11');
      if (boltTag && boltTag.length) tx.type = TransactionType.LN;
    }

    const applyStatus = (statusEvent?: NostrEvent) => {
      if (!statusEvent) return;
      const statusTag = getTagValue(statusEvent.tags, 't');
      if (!statusTag) return;

      tx.events.push(statusEvent);

      if ([TransactionTags.INTERNAL.ok, TransactionTags.OUTBOUND.ok, TransactionTags.INBOUND.ok].includes(statusTag)) {
        tx.status = TransactionStatus.CONFIRMED;
        return;
      }

      if ([TransactionTags.INTERNAL.error, TransactionTags.OUTBOUND.error, TransactionTags.INBOUND.error].includes(statusTag)) {
        tx.status = TransactionStatus.ERROR;
        const parsed = parseContent(statusEvent.content);
        if (parsed?.messages?.length) {
          tx.memo = parsed.messages[0];
          tx.errors = parsed.messages;
        }
      }
    };

    applyStatus(this.transaction.statusEvent);

    if (tx.direction === TransactionDirection.OUTGOING && tx.type === TransactionType.LN) {
      if (this.outbound) {
        tx.events.push(this.outbound.startEvent);
        const encryptedPreimage = getTagValue(this.outbound.startEvent.tags, 'preimage');
        if (encryptedPreimage) {
          tx.preimage = await this.decrypt(this.config.modulePubkeys.urlx, encryptedPreimage);
        }
        applyStatus(this.outbound.statusEvent);
      } else {
        tx.status = TransactionStatus.PENDING;
      }
    }

    if (this.refund?.startEvent) {
      tx.status = TransactionStatus.REVERTED;
      tx.events.push(this.refund.startEvent);
      if (this.refund.statusEvent) {
        tx.events.push(this.refund.statusEvent);
        const parsed = parseContent(this.refund.statusEvent.content);
        tx.memo = parsed?.memo ?? tx.memo;
        if (parsed?.memo) tx.errors.push(parsed.memo);
      }
    }

    return tx;
  }
}