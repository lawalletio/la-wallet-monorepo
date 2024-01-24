import { LaWalletKinds, buildCardConfigEvent, getTag, parseContent, parseMultiNip04Event } from '@lawallet/utils';
import {
  CardStatus,
  ConfigTypes,
  type CardConfigPayload,
  type CardDataPayload,
  type CardPayload,
  type ConfigParameter,
} from '@lawallet/utils/types';
import { broadcastEvent } from '@lawallet/utils/actions';

import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { useEffect, useMemo, useState } from 'react';
import { useSubscription } from './useSubscription.js';
import { useWalletContext } from '../context/WalletContext.js';
import { getPublicKey } from 'nostr-tools';
import { useConfig } from './useConfig.js';

export type CardConfigReturns = {
  cardsData: CardDataPayload;
  cardsConfig: CardConfigPayload;
  loadInfo: CardLoadingType;
  toggleCardStatus: (uuid: string) => Promise<boolean>;
  updateCardConfig: (uuid: string, config: CardPayload) => Promise<boolean>;
};

type CardLoadingType = {
  loadedAt: number;
  loading: boolean;
};

export interface UseCardConfigParameters extends ConfigParameter {
  privateKey: string;
}

export const useCardConfig = (parameters: UseCardConfigParameters): CardConfigReturns => {
  const pubkey = useMemo(() => getPublicKey(parameters.privateKey), [parameters.privateKey]);
  const config = useConfig(parameters);

  const [cardsData, setCardsData] = useState<CardDataPayload>({});
  const [cardsConfig, setCardsConfig] = useState<CardConfigPayload>({} as CardConfigPayload);
  const [loadInfo, setLoadInfo] = useState<CardLoadingType>({
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
        '#d': [`${pubkey}:${ConfigTypes.DATA.valueOf()}`, `${pubkey}:${ConfigTypes.CONFIG.valueOf()}`],
        authors: [config.modulePubkeys.card],
        since: loadInfo.loadedAt,
      },
    ],
    options: {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    },
    enabled: true,
  });

  const buildAndBroadcastCardConfig = (cardConfig: CardConfigPayload, privateKey: string): Promise<boolean> => {
    return buildCardConfigEvent(cardConfig, privateKey)
      .then((configEvent) => {
        return broadcastEvent(configEvent, config);
      })
      .catch(() => {
        return false;
      });
  };

  const toggleCardStatus = async (uuid: string): Promise<boolean> => {
    if (!cardsConfig.cards?.[uuid]) return false;

    const new_card_config: CardConfigPayload = {
      ...cardsConfig,
      cards: {
        ...cardsConfig.cards,
        [uuid.toString()]: {
          ...cardsConfig.cards[uuid]!,
          status: cardsConfig.cards[uuid]!.status === CardStatus.ENABLED ? CardStatus.DISABLED : CardStatus.ENABLED,
        },
      },
    };

    return buildAndBroadcastCardConfig(new_card_config, parameters.privateKey);
  };

  const updateCardConfig = async (uuid: string, config: CardPayload): Promise<boolean> => {
    if (!cardsConfig.cards?.[uuid]) return false;

    const new_card_config = {
      ...cardsConfig,
      cards: {
        ...cardsConfig.cards,
        [uuid.toString()]: {
          ...config,
          name: config.name ?? cardsData[uuid]?.design.name,
          description: config.description ?? cardsData[uuid]?.design.description,
        },
      },
    };

    return buildAndBroadcastCardConfig(new_card_config, parameters.privateKey);
  };

  const processReceivedEvent = async (event: NDKEvent) => {
    const nostrEv = await event.toNostrEvent();

    const decryptedData = await parseMultiNip04Event(nostrEv, parameters.privateKey, pubkey);
    const parsedDecryptedData = parseContent(decryptedData);

    const subkind = getTag(nostrEv.tags, 't');
    if (!subkind) return;

    if (subkind === ConfigTypes.DATA) {
      setCardsData(parsedDecryptedData);
    } else if (subkind === ConfigTypes.CONFIG) {
      setCardsConfig(parsedDecryptedData);
    }

    if (loadInfo.loading) setLoadInfo({ loadedAt: nostrEv.created_at + 1, loading: false });
  };

  useEffect(() => {
    subscription?.on('event', (data) => {
      processReceivedEvent(data);
    });
  }, [subscription]);

  useEffect(() => {
    setTimeout(() => {
      if (loadInfo.loading)
        setLoadInfo((prev) => {
          return { ...prev, loading: false };
        });
    }, 2500);
  }, []);

  return { cardsData, cardsConfig, loadInfo, toggleCardStatus, updateCardConfig };
};
