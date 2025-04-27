import type NDK from '@nostr-dev-kit/ndk';
import { NDKUser, type NDKFilter, type NDKKind, type NDKSigner, type NostrEvent } from '@nostr-dev-kit/ndk';
import {
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  type TokensAmount,
  type Transaction,
} from '../types/transaction.js';
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

export const internalTransactionFilters = (
  pubkey: string,
  since: number | undefined,
  until: number | undefined,
  limit: number | undefined,
  config: ConfigProps = baseConfig,
): NDKFilter[] => [
  {
    authors: [pubkey],
    kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
    '#t': [TransactionTags.INTERNAL.start],
    since,
    until,
    limit,
  },
  {
    '#p': [pubkey],
    '#t': [TransactionTags.INTERNAL.start],
    kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
    since,
    until,
    limit,
  },
];

export const internalStatusTransactionFilters = (
  pubkey: string,
  since: number | undefined,
  until: number | undefined,
  limit: number | undefined,
  config: ConfigProps = baseConfig,
): NDKFilter[] => [
  {
    authors: [config.modulePubkeys.ledger],
    kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
    '#p': [pubkey],
    '#t': [TransactionTags.INTERNAL.error, TransactionTags.INTERNAL.ok],
    since,
    until,
    limit,
  },
];

const CHUNK_SIZE = 20;

export function relatedTxEventFilters(
  eventIds: string[],
  config: ConfigProps = baseConfig,
  limit?: number
): NDKFilter[] {
  if (!eventIds.length) return [];

  const RELATED_TX_TAGS = [
    TransactionTags.OUTBOUND.start,
    TransactionTags.OUTBOUND.error,
    TransactionTags.OUTBOUND.ok,
    TransactionTags.INTERNAL.start,
    TransactionTags.INTERNAL.error,
    TransactionTags.INTERNAL.ok,
  ];

  const chunk = <T>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  return chunk(eventIds, CHUNK_SIZE).map((chunkIds) => ({
    kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
    authors: [config.modulePubkeys.urlx, config.modulePubkeys.ledger],
    '#t': RELATED_TX_TAGS,
    '#e': chunkIds,
    limit
  }));
}

async function resolveRelatedEvents({
  missingIds,
  ndk,
  config,
}: {
  missingIds: string[];
  ndk: NDK;
  config: ConfigProps;
}): Promise<NostrEvent[]> {
  if (!missingIds.length) return [];

  const filters = relatedTxEventFilters(missingIds, config);
  const fetched = await ndk.fetchEvents(filters, {
    groupable: false,
    closeOnEose: true,
  });

  return Promise.all(Array.from(fetched).map((e) => e.toNostrEvent()));
}

export async function linkTxWithRelatedEvents(
  events: NostrEvent[],
  pubkey: string,
  config: ConfigProps,
  ndk: NDK,
): Promise<{ started: NostrEvent[]; referencedBy: Map<string, NostrEvent[]> }> {
  const started: NostrEvent[] = [];
  const referencedBy = new Map<string, NostrEvent[]>();
  const byId = new Map<string, NostrEvent>();
  const missingRelatedEventIds: string[] = [];

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

      const hasStatus = events.some(
        (e) =>
          [TransactionTags.INTERNAL.ok, TransactionTags.INTERNAL.error].includes(getTagValue(e.tags, 't')) &&
          getMultipleTagsValues(e.tags, 'e').includes(event.id!),
      );

      if (!hasStatus) missingRelatedEventIds.push(event.id!);

      const isExternalOutgoing =
        event.pubkey === pubkey &&
        getMultipleTagsValues(event.tags, 'p').every((p) =>
          [config.modulePubkeys.urlx, config.modulePubkeys.ledger].includes(p),
        );

      if (isExternalOutgoing) {
        missingRelatedEventIds.push(event.id!);
      }
    }
  }

  if (missingRelatedEventIds.length) {
    const related = await resolveRelatedEvents({
      missingIds: missingRelatedEventIds,
      ndk,
      config,
    });

    for (const event of related) {
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

function filterRelatedEvents(startId: string, relatedEvents: NostrEvent[]): NostrEvent[] {
  return relatedEvents.filter(event => {
    const associatedIds = getMultipleTagsValues(event.tags, 'e');
    return associatedIds.includes(startId);
  });
}

export class TransactionInstance implements Transaction {
  id: string;
  status: TransactionStatus = TransactionStatus.PENDING;
  memo: string = '';
  direction: TransactionDirection = TransactionDirection.INCOMING;
  type: TransactionType = TransactionType.INTERNAL;
  tokens: TokensAmount = {};
  events: NostrEvent[];
  createdAt: number;
  metadata?: string[];
  errors: string[] = [];
  preimage?: string;
  private _metadata?: Record<string, string>;

  private pubkey: string;
  private config: ConfigProps;
  private ndk: NDK;
  private relatedEvents: NostrEvent[];

  constructor(
    private startEvent: NostrEvent,
    relatedEvents: NostrEvent[],
    pubkey: string,
    config: ConfigProps,
    ndk: NDK,
  ) {
    if (!startEvent.id) throw new Error('Invalid start event');

    this.pubkey = pubkey;
    this.config = config;
    this.ndk = ndk;

    this.id = startEvent.id;
    this.events = [startEvent];
    this.relatedEvents = filterRelatedEvents(startEvent.id, relatedEvents);
    this.createdAt = startEvent.created_at! * 1000;

    this.rebuild();
  }

  private rebuild() {
    if (!this.startEvent || !this.startEvent.id) throw new Error('Invalid start event');

    const internalType = TransactionTags.INTERNAL;
    const outboundType = TransactionTags.OUTBOUND;

    const pTagValues = getMultipleTagsValues(this.startEvent.tags, 'p');
    const AuthorIsCard = this.startEvent.pubkey === this.config.modulePubkeys.card;
    const DelegatorIsUser = AuthorIsCard && getDelegator(this.startEvent as Event) === this.pubkey;
    const AuthorIsUser = DelegatorIsUser || this.startEvent.pubkey === this.pubkey;

    if (!pTagValues.includes(this.config.modulePubkeys.ledger)) return;
    if (AuthorIsCard && !DelegatorIsUser && !pTagValues.includes(this.pubkey)) return;

    this.direction = AuthorIsUser ? TransactionDirection.OUTGOING : TransactionDirection.INCOMING;

    const content = parseContent(this.startEvent.content);
    this.memo = content.memo ?? '';
    this.tokens = content.tokens ?? 0;
    this.type = AuthorIsCard ? TransactionType.CARD : TransactionType.INTERNAL;
    this.metadata = getTag(this.startEvent.tags, 'metadata');

    const boltTag = getTagValue(this.startEvent.tags, 'bolt11');
    if (!AuthorIsCard && boltTag && boltTag.length) {
      this.type = TransactionType.LN;
    }

    this.status = TransactionStatus.PENDING;

    const applyStatus = (statusEvent?: NostrEvent) => {
      if (!statusEvent) return;
      const tag = getTagValue(statusEvent.tags, 't');
      if (!tag) return;

      this.addEvent(statusEvent);

      if ((tag === internalType.ok && (this.type === TransactionType.INTERNAL || (this.type === TransactionType.CARD && this.direction === TransactionDirection.INCOMING))) || (this.type !== TransactionType.INTERNAL && tag === outboundType.ok)) {
        this.status = TransactionStatus.CONFIRMED;
      } else if ([internalType.error, outboundType.error].includes(tag)) {
        this.status = TransactionStatus.ERROR;
        const parsed = parseContent(statusEvent.content);
        if (parsed?.messages?.length) {
          this.memo = parsed.messages[0];
          this.errors = parsed.messages;
        }
      }
    };

    const refundStart = this.relatedEvents.find(
      (e) =>
        getTagValue(e.tags, 't') === internalType.start &&
        e.pubkey === this.config.modulePubkeys.urlx &&
        getMultipleTagsValues(e.tags, 'p').includes(this.pubkey),
    );

    const internalStatus = this.relatedEvents.find((e) => {
      const isInternalStatus = [internalType.ok, internalType.error].includes(getTagValue(e.tags, 't'));
      const isRefundStatus = (refundStart && !(getMultipleTagsValues(e.tags, 'e').includes(refundStart.id!)));

      return isInternalStatus && !isRefundStatus
    });
    
    applyStatus(internalStatus);

    const outboundStart = this.relatedEvents.find((e) => getTagValue(e.tags, 't') === outboundType.start);

    if (this.direction === TransactionDirection.OUTGOING && this.type !== TransactionType.INTERNAL && outboundStart) {
      const outboundStatus = this.relatedEvents.find(
        (e) =>
          [outboundType.ok, outboundType.error].includes(getTagValue(e.tags, 't')) &&
          getMultipleTagsValues(e.tags, 'e').includes(outboundStart.id!),
      );

      this.addEvent(outboundStart);
      if (outboundStatus) this.addEvent(outboundStatus);

      const encryptedPreimage = getTagValue(outboundStart.tags, 'preimage');
      if (encryptedPreimage && this.ndk.signer) this.resolvePreimage(encryptedPreimage);

      applyStatus(outboundStatus);
    }

    if (refundStart) {
      const refundStatus = this.relatedEvents.find(
        (e) =>
          [internalType.ok, internalType.error].includes(getTagValue(e.tags, 't')) &&
          getMultipleTagsValues(e.tags, 'e').includes(refundStart.id!),
      );

      this.status = TransactionStatus.REVERTED;
      this.addEvent(refundStart);
      if (refundStatus) {
        this.addEvent(refundStatus);
        const parsed = parseContent(refundStatus.content);
        this.memo = parsed?.memo ?? this.memo;
        if (parsed?.memo) this.errors.push(parsed.memo);
      }
    }
  }

  updateWithEvent(event: NostrEvent) {
    if (!event || !event.id || !this.startEvent.id) return false;
    if (!getMultipleTagsValues(event.tags, 'e').includes(this.startEvent.id)) return false;
    
    if (!this.relatedEvents.find((e) => e.id === event.id)) {
      this.relatedEvents.push(event);
      this.rebuild();
      return true;
    }

    return false;
  }

  static async create(
    startEvent: NostrEvent,
    pubkey: string,
    config: ConfigProps,
    ndk: NDK,
    relatedEvents?: NostrEvent[],
  ): Promise<TransactionInstance> {
    const isValidStartEvent =
      startEvent.pubkey === pubkey || getMultipleTagsValues(startEvent.tags, 'p').includes(pubkey) || (startEvent.pubkey === config.modulePubkeys.card && (getDelegator(startEvent as Event) === pubkey))
    if (!isValidStartEvent) throw new Error('Provided startEvent is not a valid transaction for this pubkey.');

    relatedEvents = await this.ensureMinimumRelatedEvents(startEvent, relatedEvents ?? [], pubkey, config, ndk);
    return new TransactionInstance(startEvent, relatedEvents, pubkey, config, ndk);
  }

  private async resolvePreimage(encryptedPreimage: string): Promise<void> {
    if (!this.ndk.signer) return;

    try {
      const user = new NDKUser({ pubkey: this.config.modulePubkeys.urlx });
      const preimage = await this.ndk.signer.decrypt(user, encryptedPreimage);
      if (preimage) this.preimage = preimage;
    } catch (e) {
      console.warn('Error decrypting preimage:', e);
    }
  }

  async extractMetadata(): Promise<Record<string, string>> {
    if (this._metadata) return this._metadata;

    try {
      const receiverPubkey = getMultipleTagsValues(this.startEvent.tags, 'p')[1]!;
      const metadataTag = getTag(this.startEvent.tags, 'metadata');

      let parsedMetadata: Record<string, string> = {};

      if (metadataTag && metadataTag.length === 4) {
        const [, encrypted, encryptType, message] = metadataTag;

        if (!encrypted) {
          parsedMetadata = parseContent(message!);
        } else if (encryptType === 'nip04' && this.ndk.signer) {
          const decryptWithPubkey =
            this.direction === TransactionDirection.INCOMING ? this.startEvent.pubkey : receiverPubkey;

          const user = new NDKUser({ pubkey: decryptWithPubkey });
          const decrypted = await this.ndk.signer.decrypt(user, message!);
          if (decrypted) {
            parsedMetadata = parseContent(decrypted) ?? {};
          }
        }
      }

      if (
        this.direction === TransactionDirection.OUTGOING &&
        receiverPubkey !== this.config.modulePubkeys.urlx &&
        !parsedMetadata.receiver
      ) {
        const receiverUsername = await getUsername(receiverPubkey, this.config);
        if (receiverUsername.length) {
          parsedMetadata.receiver = `${receiverUsername}@${normalizeLNDomain(this.config.endpoints.lightningDomain)}`;
        }
      }

      if (
        this.direction === TransactionDirection.INCOMING &&
        this.startEvent.pubkey !== this.config.modulePubkeys.urlx &&
        this.startEvent.pubkey !== this.config.modulePubkeys.card &&
        !parsedMetadata.sender
      ) {
        const senderUsername = await getUsername(this.startEvent.pubkey, this.config);
        if (senderUsername.length) {
          parsedMetadata.sender = `${senderUsername}@${normalizeLNDomain(this.config.endpoints.lightningDomain)}`;
        }
      }

      this._metadata = parsedMetadata;
      return parsedMetadata;
    } catch {
      this._metadata = {};
      return {};
    }
  }

  private addEvent(event: NostrEvent) {
    if (!this.events.find((e) => e.id === event.id)) {
      this.events.push(event);
      return true;
    }

    return false;
  }

  private static needsStatusResolution(startEvent: NostrEvent, relatedEvents: NostrEvent[]): boolean {
    return !relatedEvents.some(
      (e) =>
        [TransactionTags.INTERNAL.ok, TransactionTags.INTERNAL.error].includes(getTagValue(e.tags, 't')) &&
        getMultipleTagsValues(e.tags, 'e').includes(startEvent.id!),
    );
  }

  private static needsRefundOrOutboundResolution(
    startEvent: NostrEvent,
    relatedEvents: NostrEvent[],
    pubkey: string,
    config: ConfigProps,
  ): boolean {
    const fromMe = startEvent.pubkey === pubkey;
    const pTags = getMultipleTagsValues(startEvent.tags, 'p');

    const onlyMentionsUrlxAndLedger =
      fromMe &&
      pTags.length &&
      pTags.every((p) => [config.modulePubkeys.urlx, config.modulePubkeys.ledger].includes(p));

    if (!onlyMentionsUrlxAndLedger) return false;

    const existRefund = relatedEvents.find(
      (e) =>
        getTagValue(e.tags, 't') === TransactionTags.INTERNAL.start &&
        e.pubkey === config.modulePubkeys.urlx &&
        getMultipleTagsValues(e.tags, 'p').includes(pubkey)
    );

    const refundStatus =
      existRefund &&
      relatedEvents.find(
        (e) =>
          [TransactionTags.INTERNAL.ok, TransactionTags.INTERNAL.error].includes(getTagValue(e.tags, 't')) &&
          getMultipleTagsValues(e.tags, 'e').includes(existRefund.id!),
      );

    const outboundStart = relatedEvents.find(
      (e) =>
        getTagValue(e.tags, 't') === TransactionTags.OUTBOUND.start
    );

    const outboundStatus =
      outboundStart &&
      relatedEvents.find(
        (e) =>
          [TransactionTags.OUTBOUND.ok, TransactionTags.OUTBOUND.error].includes(getTagValue(e.tags, 't')) &&
          getMultipleTagsValues(e.tags, 'e').includes(outboundStart.id!),
      );

    return (!outboundStart || !outboundStatus) && (!existRefund || !refundStatus);
  }

  private static async ensureMinimumRelatedEvents(
    startEvent: NostrEvent,
    relatedEvents: NostrEvent[],
    pubkey: string,
    config: ConfigProps,
    ndk: NDK,
  ): Promise<NostrEvent[]> {
    if (!ndk || !ndk.signer) throw new Error('NDK instance with signer is required');
    if (!startEvent.id) throw new Error('Invalid event');

    const filteredRelatedEvents = filterRelatedEvents(startEvent.id, relatedEvents)
    if (!filteredRelatedEvents.length) return resolveRelatedEvents({ missingIds: [startEvent.id], config, ndk});

    if (this.needsStatusResolution(startEvent, filteredRelatedEvents)) {
      return resolveRelatedEvents({missingIds: [startEvent.id], config, ndk});
    }

    if (this.needsRefundOrOutboundResolution(startEvent, filteredRelatedEvents, pubkey, config)) {
      return resolveRelatedEvents({ missingIds: [startEvent.id], config, ndk});
    }

    return filteredRelatedEvents;
  }

  get isConfirmed(): boolean {
    return this.status === TransactionStatus.CONFIRMED;
  }

  get isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  toJSON(): Transaction {
    return {
      id: this.id,
      status: this.status,
      memo: this.memo,
      direction: this.direction,
      type: this.type,
      tokens: this.tokens,
      events: this.events,
      createdAt: this.createdAt,
      metadata: this.metadata,
      errors: this.errors,
      preimage: this.preimage,
    };
  }
}
