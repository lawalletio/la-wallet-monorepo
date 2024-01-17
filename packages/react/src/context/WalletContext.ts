import * as React from 'react';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useUser, type UseUserReturns } from '../hooks/useUser.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useSigner } from '../hooks/useSigner.js';

interface WalletContextType {
  user: UseUserReturns;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

export const WalletContext = React.createContext({} as WalletContextType);

export function WalletProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const { children, config } = props;
  const { connectWithPrivateKey } = useSigner();

  const user: UseUserReturns = useUser({ config });
  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  const value = {
    user,
    settings,
    converter,
  };

  React.useEffect(() => {
    const { isReady, privateKey } = user.identity;
    if (isReady && privateKey) connectWithPrivateKey(privateKey);
  }, [user.identity.isReady]);

  return React.createElement(WalletContext.Provider, { value }, children);
}

export const useWalletContext = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }

  return context;
};
