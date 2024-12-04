import type { UserIdentity } from '@lawallet/utils';
import { type ConfigProps, type TokenBalance } from '@lawallet/utils/types';
import * as React from 'react';
import { useActivity, type UseActivityReturns } from '../hooks/useActivity.js';
import { useBadges, type UseBadgesReturns } from '../hooks/useBadges.js';
import { useBalance } from '../hooks/useBalance.js';
import { useConfig } from '../hooks/useConfig.js';
import { useCurrencyConverter, type UseConverterReturns } from '../hooks/useCurrencyConverter.js';
import { useIdentity } from '../hooks/useIdentity.js';
import { useProfile, type UseProfileReturns } from '../hooks/useProfile.js';
import { useSettings, type UseSettingsReturns } from '../hooks/useSettings.js';

interface WalletContextReturns {
  identity: UserIdentity;
  profile: UseProfileReturns;
  badges: UseBadgesReturns;
  activity: UseActivityReturns;
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

  const activity = useActivity({
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
    activity,
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
