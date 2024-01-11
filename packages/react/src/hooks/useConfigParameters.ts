import * as React from 'react';
import type { ConfigParameter } from '../types/config.js';
import { ConfigContext } from '../context/context.js';

export const useConfigParameters = (parameters: ConfigParameter) => {
  const config = parameters.config ?? React.useContext(ConfigContext);
  if (!config) throw new Error('`useConfigParameters` must be used within `LaWalletConfig`');

  return {
    config,
  };
};
