import type { ConfigParameter } from '@lawallet/utils/types';
import * as React from 'react';
import { ConfigContext } from '../context/providers.js';
import type { ConfigProps } from '../exports/types.js';

export type UseConfigParameters<config extends ConfigProps = ConfigProps> = ConfigParameter<config>;

export const useConfig = (parameters: UseConfigParameters = {}): ConfigProps => {
  const config = parameters.config ?? React.useContext(ConfigContext);
  if (!config) throw new Error('`useConfig` must be used within `LaWalletConfig`');

  return config as ConfigProps;
};
