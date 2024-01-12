import { parseContent } from '@lawallet/utils';
import { getUsername } from '@lawallet/utils/actions';
import { defaultIdentity, type UserIdentity } from '@lawallet/utils/types';
import { getPublicKey } from 'nostr-tools';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useConfig } from './useConfig.js';
import type { ConfigParameter } from '../types/config.js';

export interface UseIdentityReturns {
  identity: UserIdentity;
  setIdentity: Dispatch<SetStateAction<UserIdentity>>;
}

export type UseIdentityParameters = ConfigParameter & { pubkey?: string };

export const useIdentity = (params: UseIdentityParameters): UseIdentityReturns => {
  const config = useConfig(params);
  const [identity, setIdentity] = useState<UserIdentity>(defaultIdentity);

  const setDefaultIdentity = () => {
    setIdentity({
      ...defaultIdentity,
      isReady: true,
    });
  };

  const loadIdentityFromPubkey = async (pub: string) => {
    const username: string = await getUsername(pub);
    setIdentity({
      ...identity,
      username,
      hexpub: pub,
      isReady: true,
    });
  };

  const loadIdentityFromStorage = async () => {
    const storageIdentity = localStorage.getItem(STORAGE_IDENTITY_KEY);
    if (!storageIdentity) return setDefaultIdentity();

    const parsedIdentity: UserIdentity = parseContent(storageIdentity);
    if (!parsedIdentity.privateKey) return setDefaultIdentity();

    const hexpub: string = getPublicKey(parsedIdentity.privateKey);
    const username: string = await getUsername(hexpub, config);

    if (hexpub === parsedIdentity.hexpub && username == parsedIdentity.username) {
      setIdentity({
        ...parsedIdentity,
        isReady: true,
      });
    } else {
      setIdentity({
        ...parsedIdentity,
        hexpub,
        username,
        isReady: true,
      });
    }

    return;
  };

  useEffect(() => {
    params.pubkey ? loadIdentityFromPubkey(params.pubkey) : loadIdentityFromStorage();
  }, [params.pubkey]);

  return {
    identity,
    setIdentity,
  };
};
