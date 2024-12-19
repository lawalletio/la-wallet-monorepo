import type { NDKSigner } from '@nostr-dev-kit/ndk';
import { baseConfig } from './constants/constants.js';
import { createStorage, type BaseStorage, noopStorage } from './createStorage.js';
import type { ConfigProps, EndpointsConfigType } from './types/config.js';

export interface CreateConfigParameters {
  federationId?: string;
  endpoints?: {
    lightningDomain?: string;
    gateway?: string;
    proxy?: string;
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

function normalizeURL(str: string) {
  const url = new URL(str);
  return url.pathname === '/' ? `${url.protocol}//${url.host}` : url.href;
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

  let normalizedEndpoints: EndpointsConfigType = {
    gateway: endpoints && endpoints.gateway ? normalizeURL(endpoints.gateway) : baseConfig.endpoints.gateway,
    lightningDomain:
      endpoints && endpoints.lightningDomain
        ? normalizeURL(endpoints.lightningDomain)
        : baseConfig.endpoints.lightningDomain,
    proxy: endpoints && endpoints.proxy ? normalizeURL(endpoints.proxy) : baseConfig.endpoints.proxy,
  };

  return {
    ...baseConfig,
    endpoints: normalizedEndpoints,
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
