import { getPublicKey, nip19 } from 'nostr-tools';
import { baseConfig } from '../constants/constants.js';
import { getUsername } from '../interceptors/identity.js';
import type { ConfigParameter, ConfigProps } from '../types/config.js';
import { NDKEvent, NDKPrivateKeySigner, type NDKSigner, type NostrEvent } from '@nostr-dev-kit/ndk';
import NDK from '@nostr-dev-kit/ndk';
import { normalizeLNDomain } from '../utils/utilities.js';

export type SignerTypes = NDKSigner | undefined;

export class UserIdentity {
  username: string = '';
  hexpub: string = '';
  npub: string = '';
  lud16: string = '';
  loading: boolean = true;
  signer: SignerTypes = undefined;
  #config: ConfigProps = baseConfig;

  constructor(params: ConfigParameter) {
    this.#config = params.config ?? baseConfig;
  }

  async initializeFromPrivateKey(NsecOrPrivateKey: string, username?: string) {
    if (!NsecOrPrivateKey || !NsecOrPrivateKey.length) return false;

    try {
      const pubkey: string = getPublicKey(NsecOrPrivateKey);

      this.hexpub = pubkey;
      this.username = username ?? (await getUsername(pubkey, this.#config));
      this.npub = nip19.npubEncode(pubkey);

      this.lud16 = `${this.username}@${normalizeLNDomain(this.#config.endpoints.lightningDomain)}`;

      this.signer = new NDKPrivateKeySigner(NsecOrPrivateKey);
      this.loading = false;

      return true;
    } catch {
      this.loading = false;
      return false;
    }
  }

  async initializeIdentityFromPubkey(pubkey: string) {
    if (!pubkey.length) return false;

    try {
      const username: string = await getUsername(pubkey, this.#config);

      if (username.length) this.username = username;
      this.hexpub = pubkey;
      this.npub = nip19.npubEncode(pubkey);
      this.lud16 = `${this.username}@${normalizeLNDomain(this.#config.endpoints.lightningDomain)}`;
      this.signer = undefined;
      this.loading = false;

      return true;
    } catch {
      this.loading = false;
      return false;
    }
  }

  reset() {
    this.loading = false;
    this.hexpub = '';
    this.npub = '';
    this.username = '';
    this.lud16 = '';
    return;
  }

  async signEvent(event: NostrEvent): Promise<NostrEvent | undefined> {
    if (!this.signer) {
      throw new Error('You need to initialize a signer to sign an event');
    }

    const ndk = new NDK({ explicitRelayUrls: this.#config.relaysList, signer: this.signer });
    const eventToSign: NDKEvent = new NDKEvent(ndk, event);

    await eventToSign.sign();
    return eventToSign.toNostrEvent();
  }
}
