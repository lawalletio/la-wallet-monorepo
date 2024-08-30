import type { ConfigParameter } from '@lawallet/utils/types';
import {
  NDKRelay,
  NDKRelaySet,
  type NDKEvent,
  type NDKFilter,
  type NDKSubscription,
  type NDKSubscriptionOptions,
  type NostrEvent,
} from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';

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

export const useSubscription = ({ filters, options, enabled, config: configParam, onEvent }: SubscriptionProps) => {
  const config = useConfig(configParam);
  const { ndk, addEventListener, removeEventListener, knownRelays } = useNostr({ config });

  const [subscription, setSubscription] = React.useState<NDKSubscription>();
  const [events, setEvents] = React.useState<NDKEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const startSubscription = React.useCallback(async () => {
    if (ndk && enabled && !subscription) {
      setLoading(true);

      const relaySet =
        config.relaysList.length && config.relaysList.length > 0
          ? NDKRelaySet.fromRelayUrls(config.relaysList, ndk, true)
          : undefined;

      const newSubscription = ndk.subscribe(filters, options, relaySet);

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

  const handleResubscription = React.useCallback(
    (ev: Event) => {
      const relay = (ev as CustomEvent).detail as NDKRelay;
      if (subscription && enabled) relay.subscribe(subscription, filters);
    },
    [subscription, filters],
  );

  React.useEffect(() => {
    if (enabled && !subscription) {
      if (events.length) setEvents([]);
      startSubscription();
    }

    if (!enabled) stopSubscription();
  }, [enabled, subscription]);

  React.useEffect(() => {
    if (subscription && enabled) {
      addEventListener('relay:reconnect', handleResubscription);

      return () => {
        removeEventListener('relay:reconnect', handleResubscription);
      };
    }
  }, [handleResubscription]);

  return {
    loading,
    subscription,
    events,
    restartSubscription,
  };
};
