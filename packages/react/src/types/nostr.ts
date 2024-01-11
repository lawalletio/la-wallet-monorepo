import { type NostrEvent } from '@nostr-dev-kit/ndk';

type Nip07RelayMap = {
  [key: string]: {
    read: boolean;
    write: boolean;
  };
};

export default interface NostrExtensionProvider {
  enabled: boolean;

  enable: () => Promise<{ enabled: boolean }>;
  getPublicKey(): Promise<string>;
  signEvent(event: NostrEvent): Promise<{
    sig: string;
  }>;
  getRelays?: () => Promise<Nip07RelayMap>;
  nip04?: {
    encrypt(recipientHexPubKey: string, value: string): Promise<string>;
    decrypt(senderHexPubKey: string, value: string): Promise<string>;
  };
}
