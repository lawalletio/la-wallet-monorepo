import * as React from 'react'
import { WalletConfigProps } from './WalletContext.js'
import { INostr, useNOSTR } from '../hooks/useNostr.js'

export const NDKContext = React.createContext({} as INostr)

export function NDKProvider(props: React.PropsWithChildren<WalletConfigProps>) {
  const { children, relaysList } = props;
  const value = useNOSTR(relaysList)

  return React.createElement(NDKContext.Provider, { value }, children)
}

export const useNDK = () => {
  const context = React.useContext(NDKContext)
  if (!context) {
    throw new Error('useNDK must be used within NDKProvider')
  }

  return context
}
