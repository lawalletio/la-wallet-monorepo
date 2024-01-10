import NDK from '@nostr-dev-kit/ndk'
import * as React from 'react'
import { WalletConfigProps } from './WalletContext.js'

interface NDKContextType {
  ndk: NDK
}

export const NDKContext = React.createContext({} as NDKContextType)

export function NDKProvider(props: React.PropsWithChildren<WalletConfigProps>) {
  const { children, relaysList } = props;

  const [ndk] = React.useState(
    new NDK({
      explicitRelayUrls: relaysList
    })
  )

  React.useEffect(() => {
    ndk.connect()
  }, [ndk])

  const value = {
    ndk
  }

  return React.createElement(NDKContext.Provider, { value }, children)
}

export const useNDK = () => {
  const context = React.useContext(NDKContext)
  if (!context) {
    throw new Error('useNDK must be used within NDKProvider')
  }

  return context
}
