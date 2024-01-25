import type { NDKSigner } from '@nostr-dev-kit/ndk';
import type { BaseStorage } from '../createStorage.js';

export type EndpointsConfigType = {
  identity: string;
  api: string;
};

export type FederationConfigType = {
  id: string;
  domain: string;
};

export type ModulePubkeysConfigType = {
  card: string;
  ledger: string;
  urlx: string;
};

export type ConfigProps = {
  endpoints: EndpointsConfigType;
  federation: FederationConfigType;
  modulePubkeys: ModulePubkeysConfigType;
  relaysList: string[];
  storage: BaseStorage;
  signer: NDKSigner | undefined;
};

export type ConfigParameter<T extends ConfigProps = ConfigProps> = {
  config?: ConfigProps;
  signer?: NDKSigner;
};
