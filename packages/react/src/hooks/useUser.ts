import {
  type TokenBalance,
  type Transaction,
  type UserIdentity
} from '@lawallet/utils/types'
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js'
import { useActivity } from './useActivity.js'
import { useIdentity } from './useIdentity.js'
import { useTokenBalance } from './useTokenBalance.js'

export interface UserReturns {
  identity: UserIdentity
  transactions: Transaction[]
  balance: TokenBalance
  setUser: (new_identity: UserIdentity) => Promise<void>
}

export const useUser = () => {
  const { identity, setIdentity } = useIdentity()

  const { userTransactions: transactions } = useActivity({
    pubkey: identity.hexpub,
    enabled: Boolean(identity.hexpub.length),
    cache: true,
  })

  const { balance } = useTokenBalance({
    pubkey: identity.hexpub,
    tokenId: 'BTC',
    enabled: Boolean(identity.hexpub.length)
  })

  const setUser = async (new_identity: UserIdentity) => {
    setIdentity(new_identity)
    localStorage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(new_identity))
    return
  }

  return {
    setUser,
    identity,
    transactions,
    balance
  }
}
