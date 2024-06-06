import type { NDKSigner } from '@nostr-dev-kit/ndk';
import { baseConfig } from './constants/constants.js';
import { createStorage, type BaseStorage, noopStorage } from './createStorage.js';
import type { ConfigProps } from './types/config.js';

export interface CreateConfigParameters {
  federationId?: string;
  endpoints?: {
    lightningDomain?: string;
    gateway?: string;
  };
  modulePubkeys?: {
    card?: string;
    ledger?: string;
    urlx: string;
  };
  relaysList?: string[];
  storage?: BaseStorage;
  signer?: NDKSigner;
}

export function createConfig(parameters: CreateConfigParameters = {}): ConfigProps {
  const {
    endpoints,
    federationId,
    modulePubkeys,
    storage = createStorage({
      storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : noopStorage,
    }),
    signer,
    relaysList,
  } = parameters;

  return {
    ...baseConfig,
    endpoints: {
      ...baseConfig.endpoints,
      ...endpoints,
    },
    federationId: federationId ?? baseConfig.federationId,
    modulePubkeys: {
      ...baseConfig.modulePubkeys,
      ...modulePubkeys,
    },
    relaysList: relaysList ? relaysList : baseConfig.relaysList,
    storage,
    signer,
  } as ConfigProps;
}
