import { type NDKEvent, type NDKFilter, type NDKSubscription, type NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NostrContext.js';

export interface UseSubscriptionReturns {
  subscription: NDKSubscription | undefined;
  events: NDKEvent[];
}

export type SubscriptionProps = {
  filters: NDKFilter[];
  options: NDKSubscriptionOptions;
  enabled: boolean;
};

export const useSubscription = ({ filters, options, enabled }: SubscriptionProps) => {
  const { ndk } = useNostrContext();

  const [subscription, setSubscription] = React.useState<NDKSubscription>();
  const [events, setEvents] = React.useState<NDKEvent[]>([]);

  const startSubscription = React.useCallback(() => {
    if (ndk && enabled && !subscription) {
      const newSubscription = ndk.subscribe(filters, options);
      newSubscription.on('event', async (event: NDKEvent) => setEvents((prev) => [...prev, event]));

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

  React.useEffect(() => {
    if (enabled && !subscription) {
      if (events.length) setEvents([]);
      startSubscription();
    }

    if (!enabled) stopSubscription();
  }, [enabled, subscription]);

  return {
    subscription,
    events,
  };
};
