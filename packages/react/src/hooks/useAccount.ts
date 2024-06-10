import { UserIdentity } from '@lawallet/utils';
import { type ConfigParameter, type TokenBalance, type Transaction } from '@lawallet/utils/types';
import React from 'react';
import { useLaWallet } from '../context/WalletContext.js';
import { useBalance } from './useBalance.js';
import { useConfig } from './useConfig.js';
import { useTransactions } from './useTransactions.js';

export interface UseAccountReturns {
  identity: UserIdentity;
  transactions: Transaction[];
  balance: TokenBalance;
}

export interface UseAccountParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
}

export const useAccount = (params?: UseAccountParameters): UseAccountReturns => {
  if (!params) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.account;
  }

  const [enableSubscriptions, setEnableSubscriptions] = React.useState<boolean>(false);

  const config = useConfig(params);
  const [identity] = React.useState<UserIdentity>(new UserIdentity({ config: params.config }));

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

  React.useEffect(() => {
    if (params.pubkey && !identity.hexpub) {
      identity.initializeIdentityFromPubkey(params.pubkey);
    }
  }, [params.pubkey]);

  React.useEffect(() => {
    if (params.privateKey) identity.initializeFromPrivateKey(params.privateKey);
  }, [params.privateKey]);

  React.useEffect(() => {
    setEnableSubscriptions(Boolean(identity.hexpub.length));
  }, [identity.hexpub]);

  return {
    identity,
    transactions,
    balance,
  };
};
