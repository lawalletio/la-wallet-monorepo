import { defaultIdentity, parseContent } from '@lawallet/utils';
import { getUsername } from '@lawallet/utils/actions';
import type { ConfigParameter, UserIdentity } from '@lawallet/utils/types';
import { getPublicKey, nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useConfig } from './useConfig.js';

export interface UseIdentityReturns {
  info: UserIdentity;
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
  const [info, setInfo] = useState<UserIdentity>(defaultIdentity);

  const resetIdentity = () => {
    setInfo({
      ...defaultIdentity,
      isReady: true,
    });
  };

  const initializeCustomIdentity = async (privateKey: string, username: string = ''): Promise<boolean> => {
    const userPubkey = getPublicKey(privateKey);
    const usernpub = nip19.npubEncode(userPubkey);

    const identity: UserIdentity = {
      username,
      hexpub: userPubkey,
      npub: usernpub,
      privateKey,
      isReady: true,
    };

    config.storage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(identity));
    setInfo(identity);
    return true;
  };

  const loadIdentityFromPubkey = async (pub: string) => {
    const username: string = await getUsername(pub, config);
    setInfo({
      ...info,
      username,
      hexpub: pub,
      isReady: true,
    });
  };

  const loadIdentityFromPrivateKey = async (privkey: string) => {
    if (!privkey.length) {
      setInfo({ ...defaultIdentity, isReady: true });
      return;
    }

    const pubkey: string = getPublicKey(privkey);
    const username: string = await getUsername(pubkey, config);

    setInfo({
      username,
      hexpub: pubkey,
      npub: nip19.npubEncode(pubkey),
      privateKey: privkey,
      isReady: true,
    });
  };

  const loadIdentityFromStorage = async () => {
    const storageIdentity = config.storage.getItem(STORAGE_IDENTITY_KEY);
    if (!storageIdentity) return resetIdentity();

    const parsedIdentity: UserIdentity = parseContent(storageIdentity as string);
    if (!parsedIdentity.privateKey) return resetIdentity();

    const hexpub: string = getPublicKey(parsedIdentity.privateKey);
    const username: string = await getUsername(hexpub, config);

    if (hexpub === parsedIdentity.hexpub && username == parsedIdentity.username) {
      setInfo({
        ...parsedIdentity,
        isReady: true,
      });
    } else {
      setInfo({
        ...parsedIdentity,
        hexpub,
        username,
        isReady: true,
      });
    }

    return;
  };

  useEffect(() => {
    parameters.pubkey ? loadIdentityFromPubkey(parameters.pubkey) : loadIdentityFromStorage();
  }, [parameters.pubkey]);

  return {
    info,
    resetIdentity,
    initializeCustomIdentity,
    loadIdentityFromPubkey,
    loadIdentityFromPrivateKey,
  };
};
