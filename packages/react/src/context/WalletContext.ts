import * as React from 'react';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useUser, type UseUserReturns } from '../hooks/useUser.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useNostrContext } from './NostrContext.js';
import { useConfig } from '../hooks/useConfig.js';

interface WalletContextType {
  user: UseUserReturns;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

export const WalletContext = React.createContext({} as WalletContextType);

export function WalletProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const config = useConfig(props);
  const { signerInfo, authWithPrivateKey } = useNostrContext({ config });

  const user: UseUserReturns = useUser({ pubkey: signerInfo?.pubkey ?? '', config });
  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  const value = {
    user,
    settings,
    converter,
  };

  React.useEffect(() => {
    const {
      data: { privateKey },
      isLoading,
    } = user.identity;

    if (!isLoading && privateKey) authWithPrivateKey(privateKey);
  }, [user.identity.data.privateKey]);

  return React.createElement(WalletContext.Provider, { value }, props.children);
}

export const useWalletContext = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }

  return context;
};
