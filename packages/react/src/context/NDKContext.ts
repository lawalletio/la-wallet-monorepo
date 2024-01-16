import * as React from 'react';
import { baseConfig } from '@lawallet/utils';
import { type INostr, useNOSTR } from '../hooks/useNostr.js';
import { type ConfigParameter } from '@lawallet/utils/types';

export const NDKContext = React.createContext({} as INostr);

export function NDKProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config = baseConfig } = props;
  const value = useNOSTR({ explicitRelayUrls: config.relaysList, autoConnect: true });

  return React.createElement(NDKContext.Provider, { value }, children);
}

export const useNostrContext = (): INostr => {
  const context = React.useContext(NDKContext);
  if (!context) {
    throw new Error('useNostrContext must be used within NDKProvider');
  }

  return context;
};
