import { UserIdentity, parseContent } from '@lawallet/utils';
import { type ConfigParameter, type TokenBalance, type Transaction } from '@lawallet/utils/types';
import React from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useBalance } from './useBalance.js';
import { useConfig } from './useConfig.js';
import { useTransactions } from './useTransactions.js';
import { useNostrContext } from '../context/NostrContext.js';

export interface UseAccountReturns {
  identity: UserIdentity;
  transactions: Transaction[];
  balance: TokenBalance;
}

export interface UseAccountParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
  storage?: boolean;
}

export const useAccount = (params: UseAccountParameters): UseAccountReturns => {
  const [enableSubscriptions, setEnableSubscriptions] = React.useState<boolean>(false);

  const config = useConfig(params);
  const [identity] = React.useState<UserIdentity>(new UserIdentity({ config: params.config }));

  const { initializeSigner } = useNostrContext();

  const { transactions } = useTransactions({
    pubkey: identity.hexpub,
    enabled: enableSubscriptions,
    storage: true,
    config,
  });

  const { balance } = useBalance({
    pubkey: identity.hexpub,
    tokenId: 'BTC',
    enabled: enableSubscriptions,
    config,
  });

  const loadIdentityFromStorage = async () => {
    const storageIdentity = config.storage.getItem(STORAGE_IDENTITY_KEY);
    if (!storageIdentity) {
      identity.reset();
      return;
    }

    const parsedIdentity: { privateKey: string } = parseContent(storageIdentity as string);
    const initialized: boolean = await identity.initializeFromPrivateKey(parsedIdentity.privateKey);
    if (initialized) initializeSigner(identity.signer);
    return;
  };

  React.useEffect(() => {
    if (params.storage) loadIdentityFromStorage();
  }, []);

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
