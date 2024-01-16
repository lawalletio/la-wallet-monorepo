import { type TokenBalance, type Transaction, type UserIdentity } from '@lawallet/utils/types';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useActivity } from './useActivity.js';
import { useIdentity, type UseIdentityParameters } from './useIdentity.js';
import { useTokenBalance } from './useTokenBalance.js';
import { useConfig } from './useConfig.js';

export interface UseUserReturns {
  identity: UserIdentity;
  transactions: Transaction[];
  balance: TokenBalance;
  initializeUser: (new_identity: UserIdentity, isNew?: boolean) => Promise<void>;
}

export const useUser = (params: UseIdentityParameters): UseUserReturns => {
  const config = useConfig(params);
  const { identity, setIdentity, loadIdentityFromPrivateKey } = useIdentity(params);

  const { userTransactions: transactions } = useActivity({
    pubkey: identity.hexpub,
    enabled: Boolean(identity.hexpub.length),
    cache: true,
    config,
  });

  const { balance } = useTokenBalance({
    pubkey: identity.hexpub,
    tokenId: 'BTC',
    enabled: Boolean(identity.hexpub.length),
    config,
  });

  const initializeUser = async (new_identity: UserIdentity, isNew: boolean = false) => {
    isNew ? setIdentity(new_identity) : loadIdentityFromPrivateKey(new_identity.privateKey);
    config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(new_identity));
    return;
  };

  return {
    initializeUser,
    identity,
    transactions,
    balance,
  };
};
