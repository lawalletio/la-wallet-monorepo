import { NDKKind, NostrEvent } from '@nostr-dev-kit/ndk';
import { utils } from 'lnurl-pay';
import { UnsignedEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';

export function normalizeLNURL(lnurl: string): string {
  return isValidUrl(lnurl) ? lnurl : utils.decodeUrlOrAddress(removeLightningStandard(lnurl))!;
}

interface InternalTransactionEventParams {
  privateKey: string;
  k1: string;
  destinationPubKey: string;
  relays: string[];
  amount: number;
}

export function generateInternalTransactionEvent({
  privateKey,
  k1,
  destinationPubKey,
  relays,
  amount,
}: InternalTransactionEventParams) {
  const publicKey = getPublicKey(privateKey);
  const unsignedEvent: UnsignedEvent = {
    kind: 1112 as NDKKind,
    content: JSON.stringify({
      k1,
      pubkey: destinationPubKey,
      tokens: {
        BTC: amount,
      },
    }),
    pubkey: publicKey,
    created_at: Math.round(Date.now() / 1000),
    tags: [
      ['relays', ...relays!],
      ['p', publicKey],
      ['t', 'order'],
    ] as string[][],
  };

  const event: NostrEvent = {
    id: getEventHash(unsignedEvent),
    sig: getSignature(unsignedEvent, privateKey!),
    ...unsignedEvent,
  };

  return event;
}

export const removeLightningStandard = (str: string) => {
  const lowStr: string = str.toLowerCase();

  return lowStr.startsWith('lightning://')
    ? lowStr.replace('lightning://', '')
    : lowStr.startsWith('lightning:')
      ? lowStr.replace('lightning:', '')
      : lowStr;
};

export function isValidUrl(urlString: string): boolean {
  const expression = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;
  const regex = new RegExp(expression);

  return !!urlString.match(regex);
}
