import * as React from 'react';
import { baseConfig } from '@lawallet/utils';
import { type UseNostrReturns, useNostr } from '../hooks/useNostr.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useConfig } from '../hooks/useConfig.js';

export const NostrContext = React.createContext({} as UseNostrReturns);

export function NostrProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config = baseConfig } = props;
  const value = useNostr({ explicitRelayUrls: config.relaysList, autoConnect: true });

  return React.createElement(NostrContext.Provider, { value }, children);
}

export const useNostrContext = (props?: ConfigParameter): UseNostrReturns => {
  const context = React.useContext(NostrContext);

  if (!context || Object.keys(context).length === 0) {
    if (!props || !props.config) {
      throw new Error(
        'useNostrContext should be used in conjunction with a configuration or within the LaWalletConfig provider',
      );
    }

    const config = useConfig(props);
    const tmpNostrProvider = useNostr({ explicitRelayUrls: config.relaysList, explicitSigner: config.signer });

    return tmpNostrProvider;
  }

  return context;
};
