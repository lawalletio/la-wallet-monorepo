import { NDKEvent, type NDKFilter, type NDKKind } from '@nostr-dev-kit/ndk';
import React, { useEffect, useState } from 'react';
import { useNostr } from '../context/NostrContext.js';
import { useSubscription } from './useSubscription.js';
import { useLaWallet } from '../context/WalletContext.js';

interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  thumb?: string;
  title?: string;
  web?: string;
  awardedBy: string;
  awardEventId: string;
}

interface BadgesInfo {
  accepted: Badge[];
  pendings: Badge[];
}

export interface UseBadgesReturns {
  userBadges: BadgesInfo;
  acceptBadge: (awardEventId: string) => Promise<void>;
  revokeBadge: (awardEventId: string) => Promise<void>;
}

export const useBadges = (params?: { pubkey: string }): UseBadgesReturns => {
  if (!params) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.badges;
  }

  const { pubkey } = params;
  const { ndk } = useNostr();
  const [userBadges, setUserBadges] = useState<BadgesInfo>({ accepted: [], pendings: [] });

  const { events: profileBadgesEvents } = useSubscription({
    filters: [
      {
        authors: [pubkey],
        kinds: [30008 as unknown as NDKKind],
        '#d': ['profile_badges'],
      },
    ],
    options: {
      closeOnEose: false,
    },
    enabled: Boolean(pubkey.length),
  });

  const { events: badgeAwardsEvents } = useSubscription({
    filters: [
      {
        kinds: [8],
        '#p': [pubkey],
      },
    ],
    options: {
      closeOnEose: false,
    },
    enabled: Boolean(pubkey.length),
  });

  const processBadges = React.useCallback(() => {
    const badgeAwardsSet = new Set(badgeAwardsEvents);
    if (!badgeAwardsSet || !badgeAwardsSet.size) return;

    const badgeDefinitionsMap = new Map<string, NDKEvent>();
    const badgeAwardsMap = new Map<string, NDKEvent>();
    const acceptedBadgeAwardIds = new Set<string>();

    if (profileBadgesEvents.length) {
      const latestEvent = profileBadgesEvents[0] as NDKEvent;

      latestEvent.tags.forEach((tag, index) => {
        if (tag[0] === 'e' && latestEvent.tags[index - 1]?.[0] === 'a') {
          const awardEventId = tag[1];
          if (awardEventId) {
            acceptedBadgeAwardIds.add(awardEventId);
          }
        }
      });
    }

    const badgeDefinitionsSet = new Set<string>();

    badgeAwardsSet.forEach((event) => {
      const aTag = event.tags.find((tag) => tag[0] === 'a');
      if (aTag && aTag[1]) {
        badgeDefinitionsSet.add(aTag[1]);
        badgeAwardsMap.set(event.id, event);
      }
    });

    const filters = Array.from(badgeDefinitionsSet).map((aTagValue) => {
      const [kind, pubkey, identifier] = aTagValue.split(':');

      return {
        kinds: [Number(kind)],
        authors: [pubkey],
        '#d': [identifier],
      };
    });

    ndk.fetchEvents(filters as NDKFilter[], {}).then((badgeDefinitionEvents) => {
      badgeDefinitionEvents.forEach((event) => {
        const dTag = event.tags.find((tag) => tag[0] === 'd');
        if (dTag) {
          const identifier = dTag[1];
          const key = `${event.kind}:${event.pubkey}:${identifier}`;
          badgeDefinitionsMap.set(key, event);
        }
      });

      const acceptedBadges: Badge[] = [];
      const pendingBadges: Badge[] = [];

      badgeAwardsSet.forEach((awardEvent) => {
        const aTag = awardEvent.tags.find((tag) => tag[0] === 'a');
        if (aTag && aTag[1]) {
          const aTagValue = aTag[1];
          const badgeDefinition = badgeDefinitionsMap.get(aTagValue);

          if (badgeDefinition) {
            const badge: Badge = {
              id: aTagValue,
              name: badgeDefinition.tags.find((tag) => tag[0] === 'name')?.[1] || '',
              description: badgeDefinition.tags.find((tag) => tag[0] === 'description')?.[1] || '',
              image: badgeDefinition.tags.find((tag) => tag[0] === 'image')?.[1] || '',
              thumb: badgeDefinition.tags.find((tag) => tag[0] === 'thumb')?.[1],
              title: badgeDefinition.tags.find((tag) => tag[0] === 'title')?.[1],
              web: badgeDefinition.tags.find((tag) => tag[0] === 'web')?.[1],
              awardedBy: badgeDefinition.pubkey,
              awardEventId: awardEvent.id,
            };

            if (acceptedBadgeAwardIds.has(awardEvent.id)) {
              acceptedBadges.push(badge);
            } else {
              pendingBadges.push(badge);
            }
          } else {
            console.warn('Badge definition not found for: ', aTagValue);
          }
        }
      });

      setUserBadges({
        accepted: acceptedBadges,
        pendings: pendingBadges,
      });
    });
  }, [badgeAwardsEvents, profileBadgesEvents, ndk]);

  const acceptBadge = async (awardEventId: string) => {
    const badgeIndex = userBadges.pendings.findIndex((badge) => badge.awardEventId === awardEventId);
    const badge = userBadges.pendings[badgeIndex];
    if (!badge) return;

    let profileBadgesEvent = profileBadgesEvents[0];
    let newTags = profileBadgesEvent ? [...profileBadgesEvent.tags] : [];

    const hasDTag = newTags.some((tag) => tag[0] === 'd' && tag[1] === 'profile_badges');
    if (!hasDTag) {
      newTags.unshift(['d', 'profile_badges']);
    }

    newTags.push(['a', badge.id]);
    newTags.push(['e', badge.awardEventId]);

    const newEvent = new NDKEvent(ndk);
    newEvent.kind = 30008;
    newEvent.pubkey = pubkey;
    newEvent.tags = newTags;
    newEvent.content = '';

    try {
      await newEvent.sign();
      await newEvent.publish();

      setUserBadges((prev) => {
        const pendings = prev.pendings.filter((b) => b.awardEventId !== awardEventId);
        const accepted = [...prev.accepted, badge];
        return { accepted, pendings };
      });
    } catch (error) {
      console.error('Error posting event:', error);
    }
  };

  const revokeBadge = async (awardEventId: string) => {
    const badgeIndex = userBadges.accepted.findIndex((badge) => badge.awardEventId === awardEventId);
    const badge = userBadges.accepted[badgeIndex];
    if (!badge) return;

    let profileBadgesEvent = profileBadgesEvents[0];
    let newTags = profileBadgesEvent ? [...profileBadgesEvent.tags] : [];

    const hasDTag = newTags.some((tag) => tag[0] === 'd' && tag[1] === 'profile_badges');
    if (!hasDTag) {
      newTags.unshift(['d', 'profile_badges']);
    }

    const indicesToRemove: number[] = [];
    for (let i = 0; i < newTags.length; i++) {
      const tag = newTags[i]!;
      if (tag[0] === 'a' && tag[1] === badge.id) {
        if (newTags[i + 1] && newTags[i + 1]![0] === 'e' && newTags[i + 1]![1] === badge.awardEventId) {
          indicesToRemove.push(i, i + 1);
          break;
        }
      }
    }

    newTags = newTags.filter((_, idx) => !indicesToRemove.includes(idx));

    // Crear y publicar el nuevo evento
    const newEvent = new NDKEvent(ndk);
    newEvent.kind = 30008;
    newEvent.pubkey = pubkey;
    newEvent.tags = newTags;
    newEvent.content = '';

    try {
      await newEvent.sign();
      await newEvent.publish();

      // Actualizar el estado local
      setUserBadges((prev) => {
        const accepted = prev.accepted.filter((b) => b.awardEventId !== awardEventId);
        const pendings = [...prev.pendings, badge];
        return { accepted, pendings };
      });
    } catch (error) {
      console.error('Error posting event:', error);
    }
  };

  useEffect(() => {
    if (badgeAwardsEvents && badgeAwardsEvents.length > 0) {
      processBadges();
    }
  }, [profileBadgesEvents, badgeAwardsEvents, pubkey, processBadges]);

  return { userBadges, acceptBadge, revokeBadge };
};
