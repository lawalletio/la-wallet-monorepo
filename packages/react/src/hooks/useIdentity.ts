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
  resetIdentity: () => void;
  initializeCustomIdentity: (privateKey: string, username?: string) => Promise<boolean>;
  loadIdentityFromPubkey: (pubkey: string) => void;
  loadIdentityFromPrivateKey: (privkey: string) => void;
}

export interface UseIdentityParameters extends ConfigParameter {
  pubkey?: string;
}

export const useIdentity = (parameters: UseIdentityParameters): UseIdentityReturns => {
  const config = useConfig(parameters);
  const [data, setData] = useState<UserIdentity>(defaultIdentity);
  const [isLoading, setIsLoading] = useState(true);

  const resetIdentity = () => {
    setData(defaultIdentity);
    if (isLoading) setIsLoading(false);
  };

  const initializeCustomIdentity = async (privateKey: string, username: string = ''): Promise<boolean> => {
    if (!isLoading) setIsLoading(true);

    const userPubkey = getPublicKey(privateKey);
    const usernpub = nip19.npubEncode(userPubkey);

    const identity: UserIdentity = {
      username,
      hexpub: userPubkey,
      npub: usernpub,
      privateKey,
    };

    config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(identity));
    setData(identity);
    setIsLoading(false);
    return true;
  };

  const loadIdentityFromPubkey = async (pub: string) => {
    if (!isLoading) setIsLoading(true);

    const username: string = await getUsername(pub, config);
    setData({
      username,
      hexpub: pub,
      npub: nip19.npubEncode(pub),
      privateKey: '',
    });

    setIsLoading(false);
  };

  const loadIdentityFromPrivateKey = async (privkey: string) => {
    if (!privkey.length) {
      resetIdentity();
      return;
    }

    const pubkey: string = getPublicKey(privkey);
    const username: string = await getUsername(pubkey, config);

    setData({
      username,
      hexpub: pubkey,
      npub: nip19.npubEncode(pubkey),
      privateKey: privkey,
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
    parameters.pubkey ? loadIdentityFromPubkey(parameters.pubkey) : loadIdentityFromStorage();
  }, [parameters.pubkey]);

  return {
    data,
    isLoading,
    resetIdentity,
    initializeCustomIdentity,
    loadIdentityFromPubkey,
    loadIdentityFromPrivateKey,
  };
};
