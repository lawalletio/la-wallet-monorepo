import { defaultIdentity, parseContent } from '@lawallet/utils';
import { getUsername } from '@lawallet/utils/actions';
import type { ConfigParameter, UserIdentity } from '@lawallet/utils/types';
import { getPublicKey, nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useConfig } from './useConfig.js';

export interface UseIdentityReturns {
  data: UserIdentity;
  isLoading: boolean;
  initializeCustomIdentity: (privateKey: string, username: string) => Promise<boolean>;
  initializeFromPrivateKey: (privkey: string) => Promise<boolean>;
  resetIdentity: () => void;
}

export interface UseIdentityParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
  storage?: boolean;
}

export const useIdentity = (parameters: UseIdentityParameters): UseIdentityReturns => {
  const { privateKey, pubkey, storage = true } = parameters;
  const config = useConfig(parameters);

  const [data, setData] = useState<UserIdentity>(defaultIdentity);
  const [isLoading, setIsLoading] = useState(true);

  const resetIdentity = () => {
    setData(defaultIdentity);
    if (isLoading) setIsLoading(false);
  };

  const loadAndSaveInStorage = (identity: UserIdentity) => {
    setIsLoading(false);
    setData(identity);
    if (storage) config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(identity));
  };

  const initializeCustomIdentity = async (privateKey: string, username: string = ''): Promise<boolean> => {
    if (!isLoading) setIsLoading(true);

    try {
      const userPubkey = getPublicKey(privateKey);
      const usernpub = nip19.npubEncode(userPubkey);

      const identity: UserIdentity = {
        username,
        hexpub: userPubkey,
        npub: usernpub,
        privateKey,
      };

      loadAndSaveInStorage(identity);
      return true;
    } catch {
      return false;
    }
  };

  const initializeFromPrivateKey = async (privkey: string): Promise<boolean> => {
    if (!privkey.length) {
      resetIdentity();
      return false;
    }

    try {
      const pubkey: string = getPublicKey(privkey);
      const username: string = await getUsername(pubkey, config);

      loadAndSaveInStorage({
        username,
        hexpub: pubkey,
        npub: nip19.npubEncode(pubkey),
        privateKey: privkey,
      });
      return true;
    } catch {
      return false;
    }
  };

  const loadIdentityFromPubkey = async (hex: string) => {
    const username: string = await getUsername(hex, config);
    setData({
      ...data,
      hexpub: hex,
      username,
      npub: nip19.npubEncode(hex),
    });
  };

  const loadIdentityFromStorage = async () => {
    if (!isLoading) setIsLoading(true);

    const storageIdentity = config.storage.getItem(STORAGE_IDENTITY_KEY);
    if (!storageIdentity) return resetIdentity();

    const parsedIdentity: UserIdentity = parseContent(storageIdentity as string);
    if (!parsedIdentity.privateKey) return resetIdentity();

    const hexpub: string = getPublicKey(parsedIdentity.privateKey);
    const username: string = await getUsername(hexpub, config);

    if (hexpub === parsedIdentity.hexpub && username == parsedIdentity.username) {
      setData({
        ...parsedIdentity,
      });
    } else {
      setData({
        ...parsedIdentity,
        hexpub,
        username,
      });
    }

    setIsLoading(false);

    return;
  };

  useEffect(() => {
    if (storage && !privateKey) loadIdentityFromStorage();
  }, [storage]);

  useEffect(() => {
    if (pubkey) loadIdentityFromPubkey(pubkey);
  }, [pubkey]);

  useEffect(() => {
    if (privateKey) initializeFromPrivateKey(privateKey);
  }, [privateKey]);

  return {
    data,
    isLoading,
    resetIdentity,
    initializeCustomIdentity,
    initializeFromPrivateKey,
  };
};
