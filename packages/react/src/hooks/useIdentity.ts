import { UserIdentity } from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
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
  const [identity, setIdentity] = React.useState<UserIdentity>(new UserIdentity({ config }));

  React.useEffect(() => {
    const _identity: UserIdentity = new UserIdentity({ ...params, config });

    if (params.pubkey) {
      _identity.initializeIdentityFromPubkey(params.pubkey).then(() => setIdentity(_identity));
    }
  }, [params.pubkey]);

  React.useEffect(() => {
    const _identity: UserIdentity = new UserIdentity({ ...params, config });

    if (params.privateKey) {
      _identity.initializeFromPrivateKey(params.privateKey).then(() => setIdentity(_identity));
    }
  }, [params.privateKey]);

  return identity;
};
