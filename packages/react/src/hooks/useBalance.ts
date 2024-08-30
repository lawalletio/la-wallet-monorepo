import * as React from 'react';

import { LaWalletKinds } from '@lawallet/utils';
import type { ConfigParameter } from '@lawallet/utils/types';
import { type TokenBalance } from '@lawallet/utils/types';
import { NDKRelay, type NDKEvent, type NDKKind, type NostrEvent } from '@nostr-dev-kit/ndk';
import { LAWALLET_DEFAULT_RELAY } from '../constants/constants.js';
import { useNostr } from '../context/NostrContext.js';
import { useLaWallet } from '../context/WalletContext.js';
import { useConfig } from './useConfig.js';
import { useSubscription } from './useSubscription.js';

export interface UseBalanceProps extends ConfigParameter {
  pubkey: string;
  tokenId?: string;
  enabled?: boolean;
  closeOnEose?: boolean;
}

export const useBalance = (parameters?: UseBalanceProps): TokenBalance => {
  if (!parameters) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.balance;
  }

  const { pubkey, tokenId = 'BTC', enabled = true, closeOnEose = false } = parameters;

  const config = useConfig(parameters);
  const { ndk } = useNostr({ config });

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
    config,
  });

  const loadBalance = async () => {
    setBalance({
      ...balance,
      loading: true,
    });

    const event: NDKEvent | null = await ndk.fetchEvent(
      {
        authors: [config.modulePubkeys.ledger],
        kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE as unknown as NDKKind],
        '#d': [`balance:${tokenId}:${pubkey}`],
      },
      { closeOnEose: true },
      new NDKRelay(LAWALLET_DEFAULT_RELAY, undefined, ndk),
    );

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

  return balance;
};
