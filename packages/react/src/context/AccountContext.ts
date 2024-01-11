import * as React from 'react'
import {
  useCurrencyConverter,
  type UseConverterReturns
} from '../hooks/useCurrencyConverter.js'
import {
  useSettings,
  type SettingsReturns
} from '../hooks/useSettings.js'
import { useUser, type UserReturns } from '../hooks/useUser.js'
import { type ConfigParameter } from '../types/config.js'
import { useNostrContext } from './NDKContext.js'

interface AccountContextType {
  user: UserReturns
  settings: SettingsReturns
  converter: UseConverterReturns
}

export const AccountContext = React.createContext({} as AccountContextType)

export function AccountProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children } = props;
  const { connectWithPrivateKey } = useNostrContext()

  const user: UserReturns = useUser()
  const settings: SettingsReturns = useSettings()
  const converter = useCurrencyConverter()

  const value = {
    user,
    settings,
    converter
  }

  React.useEffect(() => {
    const { isReady, privateKey } = user.identity;
    if (isReady && privateKey) connectWithPrivateKey(privateKey)
  }, [user.identity.isReady])

  return React.createElement(
    AccountContext.Provider,
    { value },
    children
  )
}

export const useWalletContext = () => {
  const context = React.useContext(AccountContext)
  if (!context) {
    throw new Error('useWalletContext must be used within User provider')
  }

  return context
}