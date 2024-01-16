import * as React from 'react';

import { LaWalletKinds } from '@lawallet/utils';
import { type TokenBalance } from '@lawallet/utils/types';
import { type NDKEvent, type NDKKind, type NostrEvent } from '@nostr-dev-kit/ndk';
import { useNostrContext } from '../context/NDKContext.js';
import { useSubscription } from './useSubscription.js';
import { useConfig } from './useConfig.js';
import type { ConfigParameter } from '../types/config.js';

export interface UseTokenBalanceReturns {
  balance: TokenBalance;
}

export interface UseTokenBalanceProps extends ConfigParameter {
  pubkey: string;
  tokenId: string;
  enabled?: boolean;
  closeOnEose?: boolean;
}

export const useTokenBalance = (parameters: UseTokenBalanceProps): UseTokenBalanceReturns => {
  const { pubkey, tokenId, enabled = true, closeOnEose = false } = parameters;

  const { ndk } = useNostrContext();
  const config = useConfig(parameters);

  const [balance, setBalance] = React.useState<TokenBalance>({
    tokenId: tokenId,
    amount: 0,
    loading: true,
  });

  const { subscription: balanceSubscription } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger],
        kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE as unknown as NDKKind],
        '#d': [`balance:${tokenId}:${pubkey}`],
      },
    ],
    options: {
      groupable: false,
      closeOnEose,
    },
    enabled: !balance.loading && enabled,
  });

  const loadBalance = async () => {
    setBalance({
      ...balance,
      loading: true,
    });

    const event: NDKEvent | null = await ndk.fetchEvent({
      authors: [config.modulePubkeys.ledger],
      kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE as unknown as NDKKind],
      '#d': [`balance:${tokenId}:${pubkey}`],
    });

    if (event)
      setBalance({
        tokenId: tokenId,
        amount: event ? Number(event.getMatchingTags('amount')[0]?.[1]) / 1000 : 0,
        loading: false,
        lastEvent: event ? (event as NostrEvent) : undefined,
        createdAt: event ? new Date(event.created_at!) : new Date(),
      });
  };

  React.useEffect(() => {
    if (!enabled || !ndk) return;

    if (!pubkey.length) {
      console.log('settle');
      setBalance({
        tokenId: tokenId,
        amount: 0,
        loading: true,
      });
    } else {
      loadBalance();

      setTimeout(() => {
        if (balance.loading)
          setBalance((prev) => {
            return { ...prev, loading: false };
          });
      }, 2000);
    }
  }, [enabled, ndk, pubkey]);

  React.useEffect(() => {
    balanceSubscription?.on('event', (event) => {
      setBalance({
        tokenId: tokenId,
        amount: Number(event.getMatchingTags('amount')[0]?.[1]) / 1000,
        lastEvent: event as NostrEvent,
        createdAt: new Date(event.created_at!),
        loading: false,
      });
    });
  }, [balanceSubscription]);

  return {
    balance,
  };
};
