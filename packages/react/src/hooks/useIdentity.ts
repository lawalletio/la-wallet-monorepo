import { parseContent } from '@lawallet/utils';
import { getUsername } from '@lawallet/utils/actions';
import { defaultIdentity, type UserIdentity } from '@lawallet/utils/types';
import { getPublicKey } from 'nostr-tools';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';

export interface UseIdentityReturns {
  identity: UserIdentity;
  setUser: Dispatch<SetStateAction<UserIdentity>>;
}

export const useIdentity = () => {
  const [identity, setIdentity] = useState<UserIdentity>(defaultIdentity);

  const setDefaultIdentity = () => {
    setIdentity({
      ...defaultIdentity,
      isReady: true,
    });
  };

  const loadStoragedIdentity = async () => {
    const storageIdentity = localStorage.getItem(STORAGE_IDENTITY_KEY);
    if (!storageIdentity) return setDefaultIdentity();

    const parsedIdentity: UserIdentity = parseContent(storageIdentity);
    if (!parsedIdentity.privateKey) return setDefaultIdentity();

    const hexpub: string = getPublicKey(parsedIdentity.privateKey);
    const username: string = await getUsername(hexpub);

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
    loadStoragedIdentity();
  }, []);

  return {
    identity,
    setIdentity,
  };
};
