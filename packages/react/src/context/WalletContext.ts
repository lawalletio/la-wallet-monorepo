import * as React from 'react';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useAccount, type UseAccountReturns } from '../hooks/useAccount.js';
import { type ConfigParameter } from '@lawallet/utils/types';
import { useNostr } from './NostrContext.js';
import { useConfig } from '../hooks/useConfig.js';

interface WalletContextReturns {
  account: UseAccountReturns;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

type WalletContextParams = React.PropsWithChildren<ConfigParameter>;
export const WalletContext = React.createContext({} as WalletContextReturns);

export function WalletProvider(props: WalletContextParams) {
  const config = useConfig(props);
  const { signerInfo } = useNostr({ config });

  const account: UseAccountReturns = useAccount({ pubkey: signerInfo?.pubkey ?? '', config });
  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  const value = {
    account,
    settings,
    converter,
  };

  return React.createElement(WalletContext.Provider, { value }, props.children);
}

export const useLaWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useLaWallet must be used within WalletProvider');
  }

  return context;
};
