import * as React from 'react';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useUser, type UseUserReturns } from '../hooks/useUser.js';
import { type ConfigParameter } from '../types/config.js';
import { useSigner } from '../hooks/useSigner.js';

interface AccountContextType {
  user: UseUserReturns;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

export const AccountContext = React.createContext({} as AccountContextType);

export function AccountProvider(props: React.PropsWithChildren<ConfigParameter>) {
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

  return React.createElement(AccountContext.Provider, { value }, children);
}

export const useWalletContext = () => {
  const context = React.useContext(AccountContext);
  if (!context) {
    throw new Error('useWalletContext must be used within User provider');
  }

  return context;
};
