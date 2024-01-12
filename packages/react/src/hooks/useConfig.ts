import * as React from 'react';
import type { ConfigParameter } from '../types/config.js';
import { ConfigContext } from '../context/context.js';
import { baseConfig } from '../exports/utils.js';
import type { ConfigProps } from '../exports/types.js';

export const useConfig = (parameters: ConfigParameter = { config: baseConfig }): ConfigProps => {
  const { config } = parameters ?? React.useContext(ConfigContext);
  if (!config) throw new Error('`useConfig` must be used within `LaWalletConfig`');

  return config as ConfigProps;
};
