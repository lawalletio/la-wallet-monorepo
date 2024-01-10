import {
  useConfiguration,
  type ConfigReturns
} from '../hooks/useConfiguration.js'
import {
  useCurrencyConverter,
  type UseConverterReturns
} from '../hooks/useCurrencyConverter.js'
import { useUser, type UserReturns } from '../hooks/useUser.js'
import * as React from 'react'
import { NDKProvider } from './NDKContext.js'

export type WalletConfigProps = {
  relaysList: string[]
}

interface WalletContextType {
  user: UserReturns
  configuration: ConfigReturns
  converter: UseConverterReturns
}

export const WalletContext = React.createContext({} as WalletContextType)

export function WalletProvider(props: React.PropsWithChildren<WalletConfigProps>) {
  const { children } = props;
  
  const user: UserReturns = useUser()
  const configuration: ConfigReturns = useConfiguration()
  const converter = useCurrencyConverter()

  const value = {
    user,
    configuration,
    converter
  }

  return React.createElement(
    WalletContext.Provider,
    { value },
    children
  )
}

export const useWalletContext = () => {
  const context = React.useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider')
  }

  return context
}

export const WalletConfig = (props: React.PropsWithChildren<WalletConfigProps>) => {
  const { children } = props
  return React.createElement(NDKProvider, props, React.createElement(WalletProvider, props, children))
}