import type { BaseStorage } from '../createStorage.js';

export type EndpointsType = {
  identity: string;
  api: string;
};

export type ConfigProps = {
  endpoints: EndpointsType;
  federation: {
    id: string;
    domain: string;
  };
  modulePubkeys: {
    card: string;
    ledger: string;
    urlx: string;
  };
  relaysList: string[];
  storage: BaseStorage;
};

export type ConfigParameter<T extends ConfigProps = ConfigProps> = {
  config?: ConfigProps;
};
