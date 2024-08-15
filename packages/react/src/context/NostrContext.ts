import * as React from 'react';
import { baseConfig } from '@lawallet/utils';
import { type UseNostrReturns, useNostrHook } from '../hooks/useNostr.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useConfig } from '../hooks/useConfig.js';

export const NostrContext = React.createContext({} as UseNostrReturns);

export function NostrProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config = baseConfig } = props;
  const value = useNostrHook({
    explicitRelayUrls: config.relaysList,
    autoConnect: true,
    explicitSigner: config.signer,
  });

  return React.createElement(NostrContext.Provider, { value }, children);
}

export const useNostr = (props?: ConfigParameter): UseNostrReturns => {
  const context = React.useContext(NostrContext);
  const notFoundContext: boolean = Boolean(!context || Object.keys(context).length === 0);

  if (notFoundContext) {
    if (!props || !props.config) {
      throw new Error(
        'useNostr should be used in conjunction with a configuration or within the LaWalletConfig provider or with config props',
      );
    }

    const config = useConfig(props);
    const tmpNostrProvider = useNostrHook({ explicitRelayUrls: config.relaysList, explicitSigner: config.signer });

    return tmpNostrProvider;
  }

  return context;
};
