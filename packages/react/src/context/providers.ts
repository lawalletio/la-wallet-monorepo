import * as React from 'react';
import { baseConfig } from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
import { NostrProvider } from './NostrContext.js';
import { WalletProvider } from './WalletContext.js';
import type { ConfigProps } from '@lawallet/utils/types';

export const ConfigContext = React.createContext({} as ConfigProps);

export const LaWalletConfig = (props: React.PropsWithChildren<ConfigParameter>) => {
  const { children, config = baseConfig } = props;
  const configProps = { value: config };

  return React.createElement(NostrProvider, props, React.createElement(ConfigContext.Provider, configProps, children));
};

export const LaWalletProvider = (props: React.PropsWithChildren<ConfigParameter>) => {
  const { children, config = baseConfig } = props;
  const configProps = { value: config };

  return React.createElement(
    NostrProvider,
    props,
    React.createElement(ConfigContext.Provider, configProps, React.createElement(WalletProvider, props, children)),
  );
};
