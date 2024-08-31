import { hexToBytes } from '@noble/hashes/utils';
import { NDKEvent, NDKKind, NDKPrivateKeySigner, type NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import { finalizeEvent, getPublicKey, type EventTemplate } from 'nostr-tools';
import { baseConfig } from '../constants/constants.js';
import { ConfigTypes } from '../types/card.js';
import { type ConfigProps } from '../types/config.js';
import { nowInSeconds } from './utilities.js';
import { createDelegation } from '../libs/nip26.js';

export enum LaWalletKinds {
  REGULAR = 1112,
  EPHEMERAL = 21111,
  PARAMETRIZED_REPLACEABLE = 31111,
}

export enum LaWalletTags {
  INTERNAL_TRANSACTION_START = 'internal-transaction-start',
  INTERNAL_TRANSACTION_OK = 'internal-transaction-ok',
  INTERNAL_TRANSACTION_ERROR = 'internal-transaction-error',
  INBOUND_TRANSACTION_START = 'inbound-transaction-start',
  INBOUND_TRANSACTION_OK = 'inbound-transaction-ok',
  INBOUND_TRANSACTION_ERROR = 'inbound-transaction-error',
  OUTBOUND_TRANSACTION_OK = 'outbound-transaction-ok',
  OUTBOUND_TRANSACTION_ERROR = 'outbound-transaction-error',
  CREATE_IDENTITY = 'create-identity',
  CARD_ACTIVATION_REQUEST = 'card-activation-request',
  CARD_TRANSFER_DONATION = 'card-transfer-donation',
  CARD_TRANSFER_ACCEPTANCE = 'card-transfer-acceptance',
  BUY_HANDLE_REQUEST = 'buy-handle-request',
  CREATE_NONCE = 'create-nonce',
}

export const getTagValue = (tags: NDKTag[], keyTag: string): string => {
  const tag: NDKTag | undefined = tags.find((tag) => tag[0] === keyTag);
  return tag ? tag[1]! : '';
};

export const getTag = (tags: NDKTag[], keyTag: string): NDKTag | undefined => {
  const tagValue = tags.find((tag) => tag[0] === keyTag);
  return tagValue;
};

export const getMultipleTagsValues = (tags: NDKTag[], keyTag: string) => {
  const values: string[] = [];

  const tagsValue: NDKTag[] = tags.filter((tag) => tag[0] === keyTag);
  tagsValue.forEach((tag) => values.push(tag[1]!));

  return values;
};

export const buildIdentityEvent = (nonce: string, username: string, pubkey: string): NostrEvent => {
  return {
    pubkey,
    kind: LaWalletKinds.REGULAR,
    content: JSON.stringify({
      name: username,
      pubkey,
    }),
    tags: [
      ['t', LaWalletTags.CREATE_IDENTITY],
      ['name', username],
      ['nonce', nonce],
    ],
    created_at: nowInSeconds(),
  };
};

export const buildCardActivationEvent = async (
  otc: string,
  privateKey: string,
  config: ConfigProps = baseConfig,
): Promise<NostrEvent> => {
  const signer = new NDKPrivateKeySigner(privateKey);
  const userPubkey: string = getPublicKey(hexToBytes(privateKey));

  const delegation = createDelegation(privateKey, {
    pubkey: config.modulePubkeys.card,
    kind: LaWalletKinds.REGULAR,
    since: Math.floor(Date.now() / 1000) - 36000,
    until: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 * 12,
  });

  const event: NDKEvent = new NDKEvent();
  event.pubkey = userPubkey;
  event.kind = LaWalletKinds.EPHEMERAL;

  event.content = JSON.stringify({
    otc,
    delegation: {
      conditions: delegation.cond,
      token: delegation.sig,
    },
  });

  event.tags = [
    ['p', config.modulePubkeys.card],
    ['t', LaWalletTags.CARD_ACTIVATION_REQUEST],
  ];

  await event.sign(signer);
  return event.toNostrEvent();
};

export const buildZapRequestEvent = (
  senderPubkey: string,
  receiverPubkey: string,
  amount: number,
  config: ConfigProps = baseConfig,
  tags: NDKTag[] = [],
): NostrEvent => {
  return {
    pubkey: senderPubkey,
    content: '',
    kind: NDKKind.ZapRequest,
    tags: [['p', receiverPubkey], ['amount', amount.toString()], ['relays', ...config.relaysList], ...tags],
    created_at: nowInSeconds(),
  };
};

type TransactionProps = {
  tokenName: string;
  amount: number;
  senderPubkey: string;
  comment?: string;
  tags: NDKTag[];
};

export const buildBuyHandleRequest = (adminPubkey: string, encryptedNonce: string): NostrEvent => {
  return {
    pubkey: adminPubkey,
    kind: LaWalletKinds.REGULAR,
    content: encryptedNonce,
    tags: [['t', LaWalletTags.BUY_HANDLE_REQUEST]],
    created_at: nowInSeconds(),
  };
};

export const buildCreateNonceEvent = (adminPubkey: string, randomNonce: string): NostrEvent => {
  return {
    pubkey: adminPubkey,
    kind: LaWalletKinds.REGULAR,
    content: '',
    tags: [
      ['t', LaWalletTags.CREATE_NONCE],
      ['nonce', randomNonce],
    ],
    created_at: nowInSeconds(),
  };
};

export const buildTxStartEvent = (props: TransactionProps, config: ConfigProps = baseConfig): NostrEvent => {
  const { tokenName, amount, senderPubkey, comment, tags = [] } = props;

  const txTags: NDKTag[] = [
    ['t', LaWalletTags.INTERNAL_TRANSACTION_START],
    ['p', config.modulePubkeys.ledger],
    ...tags,
  ];

  return {
    pubkey: senderPubkey,
    kind: LaWalletKinds.REGULAR,
    content: JSON.stringify({
      tokens: { [tokenName]: (amount * 1000).toString() },
      ...(comment ? { memo: comment } : {}),
    }),
    tags: txTags,
    created_at: nowInSeconds(),
  };
};

export const buildCardConfigEvent = async (multiNip04Event: NostrEvent): Promise<NostrEvent> => {
  return {
    ...multiNip04Event,
    kind: LaWalletKinds.REGULAR,
    tags: multiNip04Event.tags.concat([['t', `${ConfigTypes.CONFIG.valueOf()}-change`]]),
  };
};

export const buildCardTransferDonationEvent = async (
  pubkey: string,
  uuidNip04: string,
  config: ConfigProps = baseConfig,
) => {
  const expiry: number = nowInSeconds() + 3600;
  const event: NostrEvent = {
    kind: LaWalletKinds.EPHEMERAL,
    pubkey,
    content: uuidNip04,
    created_at: nowInSeconds(),
    tags: [
      ['t', LaWalletTags.CARD_TRANSFER_DONATION],
      ['p', config.modulePubkeys.card],
      ['expiry', expiry.toString()],
    ],
  };

  return event;
};

export const buildCardTransferAcceptEvent = async (
  giverPubkey: string,
  donationEvent: NostrEvent,
  privateKey: string,
  config: ConfigProps = baseConfig,
) => {
  let sk = hexToBytes(privateKey);

  const delegation = createDelegation(privateKey, {
    pubkey: config.modulePubkeys.card,
    kind: LaWalletKinds.REGULAR,
    since: Math.floor(Date.now() / 1000) - 36000,
    until: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 * 12,
  });

  const event: EventTemplate = {
    kind: LaWalletKinds.EPHEMERAL,
    content: JSON.stringify({
      delegation: {
        conditions: delegation.cond,
        token: delegation.sig,
      },
      donationEvent,
    }),
    created_at: nowInSeconds(),
    tags: [
      ['t', LaWalletTags.CARD_TRANSFER_ACCEPTANCE],
      ['p', config.modulePubkeys.card],
      ['p', giverPubkey],
    ],
  };

  return finalizeEvent(event, sk);
};
