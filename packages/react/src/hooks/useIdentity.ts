import { UserIdentity } from '@lawallet/utils';
import { type ConfigParameter, type TokenBalance, type Transaction } from '@lawallet/utils/types';
import React from 'react';
import { useLaWallet } from '../context/WalletContext.js';
import { useConfig } from './useConfig.js';

export interface UseIdentityParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
}

export const useIdentity = (params?: UseIdentityParameters): UserIdentity => {
  if (!params) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.identity;
  }

  const config = useConfig(params);
  const [identity] = React.useState<UserIdentity>(new UserIdentity({ config }));

  React.useEffect(() => {
    if (params.pubkey) {
      identity.initializeIdentityFromPubkey(params.pubkey);
    }
  }, [params.pubkey]);

  React.useEffect(() => {
    if (params.privateKey) identity.initializeFromPrivateKey(params.privateKey);
  }, [params.privateKey]);

  return identity;
};
