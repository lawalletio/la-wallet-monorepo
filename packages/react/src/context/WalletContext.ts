import type { UserIdentity } from '@lawallet/utils';
import { type ConfigProps, type TokenBalance, type Transaction } from '@lawallet/utils/types';
import * as React from 'react';
import { useBalance } from '../hooks/useBalance.js';
import { useConfig } from '../hooks/useConfig.js';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useIdentity } from '../hooks/useIdentity.js';
import { useProfile, type UseProfileReturns } from '../hooks/useProfile.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';
import { useTransactions } from '../hooks/useTransactions.js';
import { useBadges, type UseBadgesReturns } from '../hooks/useBadges.js';

interface WalletContextReturns {
  identity: UserIdentity;
  profile: UseProfileReturns;
  badges: UseBadgesReturns;
  transactions: Transaction[];
  balance: TokenBalance;
  settings: UseSettingsReturns;
  converter: UseConverterReturns;
}

export type WalletContextParams = {
  children: React.ReactNode;
  config: ConfigProps;
  limits?: {
    transactionLimits?: number;
  };
};
export const WalletContext = React.createContext({} as WalletContextReturns);

export function WalletProvider(props: WalletContextParams) {
  const config = useConfig(props);
  const [enableSubscriptions, setEnableSubscriptions] = React.useState<boolean>(false);

  const identity = useIdentity({ config });

  const transactions = useTransactions({
    pubkey: identity.pubkey,
    enabled: enableSubscriptions,
    limit: props.limits?.transactionLimits || 2500,
    storage: true,
    config,
  });

  const balance = useBalance({
    pubkey: identity.pubkey,
    tokenId: 'BTC',
    enabled: enableSubscriptions,
    config,
  });

  const profile = useProfile({ pubkey: identity.pubkey });
  const badges = useBadges({ pubkey: identity.pubkey });

  const settings: UseSettingsReturns = useSettings();
  const converter: UseConverterReturns = useCurrencyConverter();

  React.useEffect(() => {
    setEnableSubscriptions(Boolean(identity.pubkey.length));
  }, [identity.pubkey]);

  const value = {
    identity,
    profile,
    badges,
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
