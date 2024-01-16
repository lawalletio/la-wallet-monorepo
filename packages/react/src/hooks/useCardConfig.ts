import {
  LaWalletKinds,
  baseConfig,
  buildCardConfigEvent,
  getTag,
  parseContent,
  parseMultiNip04Event,
} from '@lawallet/utils';

import {
  CardStatus,
  ConfigTypes,
  type CardConfigPayload,
  type CardDataPayload,
  type ConfigProps,
} from '@lawallet/utils/types';

import { broadcastEvent } from '@lawallet/utils/actions';

import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useEffect, useState } from 'react';
import { useWalletContext } from '../context/AccountContext.js';
import { useSubscription } from './useSubscription.js';
import { useConfig } from './useConfig.js';
import type { ConfigParameter } from '@lawallet/utils/types';

export type CardConfigReturns = {
  cards: ICards;
  toggleCardStatus: (uuid: string) => void;
};

export type ICards = {
  data: CardDataPayload;
  config: CardConfigPayload;
  loadedAt: number;
  loading: boolean;
};

export const useCardConfig = (parameters: ConfigParameter = {}): CardConfigReturns => {
  const config = useConfig(parameters);
  const [cards, setCards] = useState<ICards>({
    data: {},
    config: {} as CardConfigPayload,
    loadedAt: 0,
    loading: true,
  });

  const {
    user: { identity },
  } = useWalletContext();

  const { subscription } = useSubscription({
    filters: [
      {
        kinds: [LaWalletKinds.PARAMETRIZED_REPLACEABLE.valueOf() as NDKKind],
        '#d': [
          `${identity.hexpub}:${ConfigTypes.DATA.valueOf()}`,
          `${identity.hexpub}:${ConfigTypes.CONFIG.valueOf()}`,
        ],
        authors: [config.modulePubkeys.card],
        since: cards.loadedAt,
      },
    ],
    options: {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    },
    enabled: true,
  });

  const buildAndBroadcastCardConfig = (cardConfig: CardConfigPayload, privateKey: string) => {
    buildCardConfigEvent(cardConfig, privateKey)
      .then((configEvent) => {
        return broadcastEvent(configEvent, config);
      })
      .catch(() => {
        return { error: 'UNEXPECTED_ERROR' };
      });
  };

  const toggleCardStatus = (uuid: string) => {
    const new_card_config = {
      ...cards.config,
      cards: {
        ...cards.config.cards,
        [uuid.toString()]: {
          ...cards.config.cards?.[uuid],
          status: cards.config.cards?.[uuid]?.status === CardStatus.ENABLED ? CardStatus.DISABLED : CardStatus.ENABLED,
        },
      },
    };

    buildAndBroadcastCardConfig(new_card_config as CardConfigPayload, identity.privateKey);
  };

  const processReceivedEvent = async (event: NDKEvent) => {
    try {
      const nostrEv = await event.toNostrEvent();

      const parsedEncryptedData = await parseMultiNip04Event(nostrEv, identity.privateKey, identity.hexpub);

      const subkind: string | undefined = getTag(nostrEv.tags, 't');
      if (subkind)
        setCards((prev) => {
          return {
            ...prev,
            loadedAt: nostrEv.created_at + 1,
            [subkind === ConfigTypes.DATA ? 'data' : 'config']: parseContent(parsedEncryptedData),
            loading: false,
          };
        });
    } catch (err) {
      console.log(err);
      setCards({
        ...cards,
        loading: false,
      });
    }
  };

  useEffect(() => {
    subscription?.on('event', (data: NDKEvent) => {
      processReceivedEvent(data);
    });
  }, [subscription]);

  return { cards, toggleCardStatus };
};
