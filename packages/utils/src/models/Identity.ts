import { getPublicKey, nip19 } from 'nostr-tools';
import { baseConfig } from '../constants/constants.js';
import { getUsername } from '../interceptors/identity.js';
import type { ConfigParameter, ConfigProps } from '../types/config.js';
import { NDKEvent, NDKPrivateKeySigner, type NDKSigner, type NostrEvent } from '@nostr-dev-kit/ndk';
import NDK from '@nostr-dev-kit/ndk';
import { normalizeLNDomain } from '../utils/utilities.js';

export type SignerTypes = NDKSigner | undefined;

interface IdentityConsctuctorParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
}

export class UserIdentity {
  username: string = '';
  pubkey: string = '';
  npub: string = '';
  lud16: string = '';
  federationId = '';
  loading: boolean = true;
  signer: SignerTypes = undefined;
  #config: ConfigProps = baseConfig;

  constructor(params: IdentityConsctuctorParameters) {
    this.#config = params.config ?? baseConfig;
    this.federationId = this.#config.federationId;

    if (params.pubkey) this.initializeIdentityFromPubkey(params.pubkey);
    if (params.privateKey) this.initializeFromPrivateKey(params.privateKey);
  }

  async initializeFromPrivateKey(NsecOrPrivateKey: string, username?: string) {
    if (!NsecOrPrivateKey || !NsecOrPrivateKey.length) return false;

    try {
      const pubkey: string = getPublicKey(NsecOrPrivateKey);

      this.pubkey = pubkey;
      this.username = username ?? (await getUsername(pubkey, this.#config));
      this.npub = nip19.npubEncode(pubkey);

      this.lud16 = this.username.length
        ? `${this.username}@${normalizeLNDomain(this.#config.endpoints.lightningDomain)}`
        : '';

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
      this.pubkey = pubkey;
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
    this.pubkey = '';
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
