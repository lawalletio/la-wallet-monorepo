import * as React from 'react'
import {
  useConfiguration,
  type ConfigReturns
} from '../hooks/useConfiguration.js'
import {
  useCurrencyConverter,
  type UseConverterReturns
} from '../hooks/useCurrencyConverter.js'
import { useUser, type UserReturns } from '../hooks/useUser.js'
import { type ConfigParameter } from '../types/config.js'
import { useNostrContext } from './NDKContext.js'

interface WalletContextType {
  user: UserReturns
  configuration: ConfigReturns
  converter: UseConverterReturns
}

export const WalletContext = React.createContext({} as WalletContextType)

export function WalletProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children } = props;
  const { connectWithHexKey } = useNostrContext()

  const user: UserReturns = useUser()
  const configuration: ConfigReturns = useConfiguration()
  const converter = useCurrencyConverter()

  const value = {
    user,
    configuration,
    converter
  }

  React.useEffect(() => {
    const { isReady, privateKey } = user.identity;
    if (isReady && privateKey) connectWithHexKey(privateKey)
  }, [user.identity.isReady])

  return React.createElement(
    WalletContext.Provider,
    { value },
    children
  )
}

export const useWalletContext = () => {
  const context = React.useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within WalletConfig provider')
  }

  return context
}