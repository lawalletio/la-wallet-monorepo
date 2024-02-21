import type { NDKSigner } from '@nostr-dev-kit/ndk';
import type { BaseStorage } from '../createStorage.js';

export type EndpointsConfigType = {
  lightningDomain: string;
  gateway: string;
};

export type ModulePubkeysConfigType = {
  card: string;
  ledger: string;
  urlx: string;
};

export type ConfigProps = {
  endpoints: EndpointsConfigType;
  federationId: string;
  modulePubkeys: ModulePubkeysConfigType;
  relaysList: string[];
  storage: BaseStorage;
  signer: NDKSigner | undefined;
};

export type ConfigParameter<T extends ConfigProps = ConfigProps> = {
  config?: ConfigProps;
  signer?: NDKSigner;
};
