import { baseConfig } from './constants/constants.js';
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
  relaysList?: string;
}

export function createConfig(parameters: CreateConfigParameters = {}): ConfigProps {
  return {
    ...baseConfig,
    ...parameters,
  } as ConfigProps;
}
