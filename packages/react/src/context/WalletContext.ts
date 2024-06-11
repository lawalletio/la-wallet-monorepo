import type { UserIdentity } from '@lawallet/utils';
import { type ConfigParameter, type TokenBalance, type Transaction } from '@lawallet/utils/types';
import * as React from 'react';
import { useBalance } from '../hooks/useBalance.js';
import { useConfig } from '../hooks/useConfig.js';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useIdentity } from '../hooks/useIdentity.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useTransactions } from '../hooks/useTransactions.js';
import { useNostr } from './NostrContext.js';

interface WalletContextReturns {
  identity: UserIdentity;
  transactions: Transaction[];
  balance: TokenBalance;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

type WalletContextParams = React.PropsWithChildren<ConfigParameter>;
export const WalletContext = React.createContext({} as WalletContextReturns);

export function WalletProvider(props: WalletContextParams) {
  const config = useConfig(props);
  const { signerInfo } = useNostr({ config });
  const [enableSubscriptions, setEnableSubscriptions] = React.useState<boolean>(false);

  const identity = useIdentity({ pubkey: signerInfo?.pubkey ?? '', config });

  const transactions = useTransactions({
    pubkey: identity.hexpub,
    enabled: enableSubscriptions,
    storage: true,
    config,
  });

  const balance = useBalance({
    pubkey: identity.hexpub,
    tokenId: 'BTC',
    enabled: enableSubscriptions,
    config,
  });

  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  React.useEffect(() => {
    setEnableSubscriptions(Boolean(identity.hexpub.length));
  }, [identity.hexpub]);

  const value = {
    identity,
    transactions,
    balance,
    settings,
    converter,
  };

  return React.createElement(WalletContext.Provider, { value }, props.children);
}

export const useLaWallet = () => {
  const context = React.useContext(WalletContext);

  return context;
};
