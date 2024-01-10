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

interface WalletContextType {
  user: UserReturns
  configuration: ConfigReturns
  converter: UseConverterReturns
}

export const WalletContext = React.createContext({} as WalletContextType)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // const [hydrated, setHydrated] = React.useState<boolean>(false)

  const user: UserReturns = useUser()
  const configuration: ConfigReturns = useConfiguration()
  const converter = useCurrencyConverter()

  // React.useEffect(() => {
  //   if (user.identity.isReady) setHydrated(true)
  // }, [user.identity.isReady])

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
