import { type NDKEvent, type NDKFilter, type NDKSubscription, type NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NostrContext.js';
import type { ConfigParameter } from '../exports/types.js';

export interface UseSubscriptionReturns {
  loading: boolean;
  subscription: NDKSubscription | undefined;
  events: NDKEvent[];
  restartSubscription: () => void;
}

export interface SubscriptionProps extends ConfigParameter {
  filters: NDKFilter[];
  options: NDKSubscriptionOptions;
  enabled: boolean;
}

export const useSubscription = ({ filters, options, enabled, config }: SubscriptionProps) => {
  const { ndk } = useNostrContext({ config });

  const [subscription, setSubscription] = React.useState<NDKSubscription>();
  const [events, setEvents] = React.useState<NDKEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const startSubscription = React.useCallback(() => {
    if (ndk && enabled && !subscription) {
      setLoading(true);
      const newSubscription = ndk.subscribe(filters, options);
      newSubscription.on('event', async (event: NDKEvent) => setEvents((prev) => [...prev, event]));

      newSubscription.on('eose', () => {
        setLoading(false);
      });

      setSubscription(newSubscription);
      return;
    }
  }, [ndk, enabled, subscription]);

  const stopSubscription = React.useCallback(() => {
    if (subscription) {
      subscription.stop();
      subscription.removeAllListeners();
      setSubscription(undefined);
    }
  }, [subscription]);

  const restartSubscription = React.useCallback(() => {
    stopSubscription();

    if (events.length) setEvents([]);

    startSubscription();
  }, [events]);

  React.useEffect(() => {
    if (enabled && !subscription) {
      if (events.length) setEvents([]);
      startSubscription();
    }

    if (!enabled) stopSubscription();
  }, [enabled, subscription]);

  return {
    loading,
    subscription,
    events,
    restartSubscription,
  };
};
