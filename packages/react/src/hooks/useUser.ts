import { type TokenBalance, type Transaction, type UserIdentity } from '@lawallet/utils/types';
import { useActivity } from './useActivity.js';
import { useTokenBalance } from './useTokenBalance.js';
import { useConfig } from './useConfig.js';
import { useIdentity, type UseIdentityParameters, type UseIdentityReturns } from './useIdentity.js';

export interface UseUserReturns {
  identity: UseIdentityReturns;
  transactions: Transaction[];
  balance: TokenBalance;
}

export const useUser = (params: UseIdentityParameters): UseUserReturns => {
  const config = useConfig(params);
  const identity = useIdentity(params);

  const { transactions } = useActivity({
    pubkey: identity.info.hexpub,
    enabled: Boolean(identity.info.hexpub.length),
    storage: true,
    config,
  });

  const { balance } = useTokenBalance({
    pubkey: identity.info.hexpub,
    tokenId: 'BTC',
    enabled: Boolean(identity.info.hexpub.length),
    config,
  });

  return {
    identity,
    transactions,
    balance,
  };
};
