import { type TokenBalance, type Transaction, type UserIdentity } from '@lawallet/utils/types';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useActivity } from './useActivity.js';
import { useIdentity } from './useIdentity.js';
import { useTokenBalance } from './useTokenBalance.js';
import { useConfig } from './useConfig.js';

export interface UseUserReturns {
  identity: UserIdentity;
  transactions: Transaction[];
  balance: TokenBalance;
  setUser: (new_identity: UserIdentity) => Promise<void>;
}

export const useUser = (): UseUserReturns => {
  const config = useConfig();
  const { identity, setIdentity } = useIdentity();

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

  const setUser = async (new_identity: UserIdentity) => {
    setIdentity(new_identity);
    localStorage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(new_identity));
    return;
  };

  return {
    setUser,
    identity,
    transactions,
    balance,
  };
};
