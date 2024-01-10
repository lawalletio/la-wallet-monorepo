import * as React from 'react'
import { baseConfig } from '@lawallet/utils'
import { INostr, useNOSTR } from '../hooks/useNostr.js'
import { ConfigParameter } from '../types/config.js';

export const NDKContext = React.createContext({} as INostr)

export function NDKProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config = baseConfig } = props;
  const value = useNOSTR(config.relaysList)

  return React.createElement(NDKContext.Provider, { value }, children)
}

export const useNDK = () => {
  const context = React.useContext(NDKContext)
  if (!context) {
    throw new Error('useNDK must be used within NDKProvider')
  }

  return context
}
