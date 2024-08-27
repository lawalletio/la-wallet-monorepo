import {
  type NDKEvent,
  type NDKFilter,
  type NDKSubscription,
  type NDKSubscriptionOptions,
  type NostrEvent,
} from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostr } from '../context/NostrContext.js';
import type { ConfigParameter } from '@lawallet/utils/types';

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
  onEvent?: (event: NostrEvent) => void;
}

export const useSubscription = ({ filters, options, enabled, config, onEvent }: SubscriptionProps) => {
  const { ndk } = useNostr({ config });

  const [subscription, setSubscription] = React.useState<NDKSubscription>();
  const [events, setEvents] = React.useState<NDKEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const startSubscription = React.useCallback(async () => {
    if (ndk && enabled && !subscription) {
      setLoading(true);

      const newSubscription = ndk.subscribe(filters, options);
      newSubscription.on('event', async (event: NDKEvent) => {
        setEvents((prev) => {
          const uniqueEvents = new Map<string, typeof event>();

          [...prev, event].forEach((e) => {
            uniqueEvents.set(e.id, e);
          });

          return [...uniqueEvents.values()].sort((a, b) => b.created_at! - a.created_at!);
        });

        if (onEvent) onEvent(await event.toNostrEvent());
      });

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
