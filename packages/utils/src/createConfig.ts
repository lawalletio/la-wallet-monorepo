import { baseConfig } from './constants/constants.js';
import { createStorage, type BaseStorage, noopStorage } from './createStorage.js';
import type { ConfigProps } from './types/config.js';

export interface CreateConfigParameters {
  endpoints?: {
    identity?: string;
    api?: string;
  };
  federation?: {
    id?: string;
    domain?: string;
  };
  modulePubkeys?: {
    card?: string;
    ledger?: string;
    urlx: string;
  };
  relaysList?: string[];
  storage?: BaseStorage;
}

export function createConfig(parameters: CreateConfigParameters = {}): ConfigProps {
  const {
    endpoints,
    federation,
    modulePubkeys,
    storage = createStorage({
      storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : noopStorage,
    }),
  } = parameters;

  return {
    ...baseConfig,
    endpoints: {
      ...baseConfig.endpoints,
      ...endpoints,
    },
    federation: {
      ...baseConfig.federation,
      ...federation,
    },
    modulePubkeys: {
      ...baseConfig.modulePubkeys,
      ...modulePubkeys,
    },
    storage,
  } as ConfigProps;
}