import * as React from 'react';
import { baseConfig } from '@lawallet/utils';
import { type UseNostrReturns, useNostr } from '../hooks/useNostr.js';
import { type ConfigParameter } from '@lawallet/utils/types';

export const NostrContext = React.createContext({} as UseNostrReturns);

export function NostrProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config = baseConfig } = props;
  const value = useNostr({ explicitRelayUrls: config.relaysList, autoConnect: true });

  return React.createElement(NostrContext.Provider, { value }, children);
}

export const useNostrContext = (): UseNostrReturns => {
  const context = React.useContext(NostrContext);
  if (!context) {
    throw new Error('useNostrContext must be used within NostrProvider');
  }

  return context;
};
