import { type TokenBalance, type Transaction } from '@lawallet/utils/types';
import { useTransactions } from './useTransactions.js';
import { useBalance } from './useBalance.js';
import { useConfig } from './useConfig.js';
import { useIdentity, type UseIdentityParameters, type UseIdentityReturns } from './useIdentity.js';

export interface UseAccountReturns {
  identity: UseIdentityReturns;
  transactions: Transaction[];
  balance: TokenBalance;
}

export const useAccount = (params: UseIdentityParameters): UseAccountReturns => {
  const config = useConfig(params);
  const identity = useIdentity(params);

  const { transactions } = useTransactions({
    pubkey: identity.data.hexpub,
    enabled: Boolean(identity.data.hexpub.length),
    storage: true,
    config,
  });

  const { balance } = useBalance({
    pubkey: identity.data.hexpub,
    tokenId: 'BTC',
    enabled: Boolean(identity.data.hexpub.length),
    config,
  });

  return {
    identity,
    transactions,
    balance,
  };
};
