import type { NDKSigner } from '@nostr-dev-kit/ndk';
import { baseConfig } from './constants/constants.js';
import { createStorage, type BaseStorage, noopStorage } from './createStorage.js';
import type { ConfigProps } from './types/config.js';

export interface CreateConfigParameters {
  federationId?: string;
  endpoints?: {
    identity?: string;
    api?: string;
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
  } = parameters;

  const identityURL = new URL(endpoints?.identity ?? baseConfig.endpoints.identity);

  return {
    ...baseConfig,
    endpoints: {
      ...baseConfig.endpoints,
      ...endpoints,
    },
    federation: {
      id: federationId ?? baseConfig.federation.id,
      domain: identityURL.hostname,
    },
    modulePubkeys: {
      ...baseConfig.modulePubkeys,
      ...modulePubkeys,
    },
    storage,
    signer,
  } as ConfigProps;
}
