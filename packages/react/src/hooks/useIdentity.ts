import { UserIdentity } from '@lawallet/utils';
import { type ConfigParameter } from '@lawallet/utils/types';
import React from 'react';
import { useLaWallet } from '../context/WalletContext.js';
import { useConfig } from './useConfig.js';

export interface UseIdentityParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
}

function useForceRender() {
  const [, update] = React.useReducer((c) => c + 1, 0);
  return update;
}

class ReactiveUserIdentity extends UserIdentity {
  #forceRender: () => void;

  constructor(params: UseIdentityParameters, forceRender: () => void) {
    super(params);
    this.#forceRender = forceRender;
  }

  override reset() {
    super.reset();
    this.#forceRender();
  }

  override async initializeFromPrivateKey(key: string, username?: string) {
    const result = await super.initializeFromPrivateKey(key, username);
    this.#forceRender();
    return result;
  }

  override async initializeIdentityFromPubkey(pubkey: string) {
    const result = await super.initializeIdentityFromPubkey(pubkey);
    this.#forceRender();
    return result;
  }
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
  const forceRender = useForceRender();
  const [identity] = React.useState<UserIdentity>(() => new ReactiveUserIdentity({ ...params, config }, forceRender));

  React.useEffect(() => {
    if (params.pubkey) {
      identity.initializeIdentityFromPubkey(params.pubkey);
    }
  }, [params.pubkey]);

  React.useEffect(() => {
    if (params.privateKey) {
      identity.initializeFromPrivateKey(params.privateKey);
    }
  }, [params.privateKey]);

  return identity;
};
