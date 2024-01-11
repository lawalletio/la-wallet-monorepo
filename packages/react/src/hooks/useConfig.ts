import * as React from 'react';
import type { ConfigParameter } from '../types/config.js';
import { ConfigContext } from '../context/context.js';

export const useConfig = (parameters: ConfigParameter): ConfigParameter => {
  const config = parameters ?? React.useContext(ConfigContext);
  if (!config) throw new Error('`useConfig` must be used within `LaWalletConfig`');

  return {
    config,
  } as ConfigParameter;
};
