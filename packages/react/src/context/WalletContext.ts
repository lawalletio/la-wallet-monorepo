import * as React from 'react';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useAccount, type UseAccountReturns } from '../hooks/useAccount.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useNostrContext } from './NostrContext.js';
import { useConfig } from '../hooks/useConfig.js';

interface WalletContextType {
  account: UseAccountReturns;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

export const WalletContext = React.createContext({} as WalletContextType);

export function WalletProvider(props: React.PropsWithChildren<ConfigParameter>) {
  const config = useConfig(props);
  const { signerInfo } = useNostrContext({ config });

  const account: UseAccountReturns = useAccount({ pubkey: signerInfo?.pubkey ?? '', storage: true, config });
  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  const value = {
    account,
    settings,
    converter,
  };

  return React.createElement(WalletContext.Provider, { value }, props.children);
}

export const useWalletContext = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }

  return context;
};
