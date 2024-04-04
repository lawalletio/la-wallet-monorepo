import {
  LaWalletKinds,
  buildCardConfigEvent,
  buildCardTransferDonationEvent,
  extendedMultiNip04Decrypt,
  extendedMultiNip04Encrypt,
  getTagValue,
  parseContent,
} from '@lawallet/utils';
import { broadcastEvent } from '@lawallet/utils/actions';
import {
  CardStatus,
  ConfigTypes,
  type CardConfigPayload,
  type CardDataPayload,
  type CardPayload,
  type ConfigParameter,
} from '@lawallet/utils/types';

import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage, type NostrEvent } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { useSubscription } from './useSubscription.js';

export interface CardConfigReturns {
  cardsData: CardDataPayload;
  cardsConfig: CardConfigPayload;
  loadInfo: CardLoadingType;
  toggleCardStatus: (uuid: string) => Promise<boolean>;
  updateCardConfig: (uuid: string, config: CardPayload) => Promise<boolean>;
  buildDonationEvent: (uuid: string) => Promise<NostrEvent | undefined>;
}

type CardLoadingType = {
  loadedAt: number;
  loading: boolean;
};

export interface UseCardsParameters extends ConfigParameter {}

export const useCards = (parameters: UseCardsParameters): CardConfigReturns => {
  const config = useConfig(parameters);

  const [cardsData, setCardsData] = React.useState<CardDataPayload>({});
  const [cardsConfig, setCardsConfig] = React.useState<CardConfigPayload>({} as CardConfigPayload);
  const [loadInfo, setLoadInfo] = React.useState<CardLoadingType>({
    loadedAt: 0,
    loading: true,
  });

  const { encrypt, decrypt, signerInfo, signEvent } = useNostrContext();
  const pubkey = React.useMemo(() => (signerInfo ? signerInfo.pubkey : ''), [signerInfo]);

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
    config,
  });

  const buildAndBroadcastCardConfig = async (cardConfig: CardConfigPayload): Promise<boolean> => {
    if (!pubkey) return false;

    try {
      const receiverPubkeys: string[] = [config.modulePubkeys.card, pubkey];
      const nip04Event: NostrEvent = await buildCardConfigEvent(
        await extendedMultiNip04Encrypt(JSON.stringify(cardConfig), pubkey, receiverPubkeys, encrypt),
      );

      const signedEvent = await signEvent(nip04Event);
      return broadcastEvent(signedEvent, config);
    } catch {
      return false;
    }
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

    return buildAndBroadcastCardConfig(new_card_config);
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

    return buildAndBroadcastCardConfig(new_card_config);
  };

  const processReceivedEvent = async (event: NDKEvent) => {
    const nostrEv = await event.toNostrEvent();

    const decryptedContent = await extendedMultiNip04Decrypt(nostrEv, pubkey, decrypt);
    const parsedDecryptedData = parseContent(decryptedContent);

    const subkind = getTagValue(nostrEv.tags, 't');
    if (!subkind) return;

    if (subkind === ConfigTypes.DATA) {
      setCardsData(parsedDecryptedData);
    } else if (subkind === ConfigTypes.CONFIG) {
      setCardsConfig(parsedDecryptedData);
    }

    if (loadInfo.loading) setLoadInfo({ loadedAt: nostrEv.created_at + 1, loading: false });
  };

  const buildDonationEvent = async (uuid: string): Promise<NostrEvent | undefined> => {
    try {
      if (!pubkey) return;
      const encryptedUUID: string | undefined = await encrypt(config.modulePubkeys.card, uuid);
      if (!encryptedUUID) return;

      const transferDonationEvent = await buildCardTransferDonationEvent(pubkey, encryptedUUID, config);
      const signedEvent: NostrEvent = await signEvent(transferDonationEvent);

      return signedEvent;
    } catch {
      return;
    }
  };

  React.useEffect(() => {
    subscription?.on('event', (data) => {
      processReceivedEvent(data);
    });
  }, [subscription]);

  React.useEffect(() => {
    setTimeout(() => {
      if (loadInfo.loading)
        setLoadInfo((prev) => {
          return { ...prev, loading: false };
        });
    }, 2500);
  }, []);

  return { cardsData, cardsConfig, loadInfo, toggleCardStatus, updateCardConfig, buildDonationEvent };
};
