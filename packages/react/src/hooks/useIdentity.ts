import { buildIdentityEvent, defaultIdentity, parseContent } from '@lawallet/utils';
import { claimIdentity, generateUserIdentity, getUsername, type IdentityResponse } from '@lawallet/utils/actions';
import type { ConfigParameter, UserIdentity } from '@lawallet/utils/types';
import { getPublicKey, nip19 } from 'nostr-tools';
import * as React from 'react';
import { STORAGE_IDENTITY_KEY } from '../constants/constants.js';
import { useConfig } from './useConfig.js';
import NDK, { NDKEvent, NDKPrivateKeySigner, type NostrEvent } from '@nostr-dev-kit/ndk';

export interface UseIdentityReturns {
  data: UserIdentity;
  isLoading: boolean;
  createIdentity: (props: CreateIdentityProps) => Promise<CreateIdentityReturns>;
  initializeCustomIdentity: (privateKey: string, username: string) => Promise<boolean>;
  initializeFromPrivateKey: (privkey: string) => Promise<boolean>;
  resetIdentity: () => void;
}

export type CreateIdentityProps = {
  nonce: string;
  name: string;
};

export type CreateIdentityReturns = {
  success: boolean;
  message: string;
  newIdentity?: UserIdentity;
};

export interface UseIdentityParameters extends ConfigParameter {
  pubkey?: string;
  privateKey?: string;
  storage?: boolean;
}

export const useIdentity = (parameters: UseIdentityParameters): UseIdentityReturns => {
  const { privateKey, pubkey, storage = true } = parameters;
  const config = useConfig(parameters);

  const [data, setData] = React.useState<UserIdentity>(defaultIdentity);
  const [isLoading, setIsLoading] = React.useState(true);

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

    setData({
      ...parsedIdentity,
      username,
      hexpub: hexpub !== parsedIdentity.hexpub ? hexpub : parsedIdentity.hexpub,
    });

    setIsLoading(false);
    return;
  };

  const createIdentity = async ({ nonce, name }: CreateIdentityProps): Promise<CreateIdentityReturns> => {
    const generatedIdentity: UserIdentity = await generateUserIdentity(name);
    const signer = new NDKPrivateKeySigner(generatedIdentity.privateKey);

    if (!signer)
      return {
        success: false,
        message: 'ERROR_WITH_SIGNER',
      };

    try {
      const ndk = new NDK({ signer });
      const eventToSign: NDKEvent = new NDKEvent(ndk, buildIdentityEvent(nonce, generatedIdentity));
      await eventToSign.sign();

      const identityEvent: NostrEvent | undefined = await eventToSign.toNostrEvent();

      if (!identityEvent)
        return {
          success: false,
          message: 'ERROR_WITH_IDENTITY_EVENT',
        };

      const createdAccount: IdentityResponse = await claimIdentity(identityEvent, config);

      if (!createdAccount.success)
        return {
          success: false,
          message: createdAccount.reason!,
        };

      return {
        success: true,
        message: 'ok',
        newIdentity: generatedIdentity,
      };
    } catch {
      return {
        success: false,
        message: 'ERROR_ON_CREATE_ACCOUNT',
      };
    }
  };

  React.useEffect(() => {
    if (storage && !privateKey) loadIdentityFromStorage();
  }, [storage]);

  React.useEffect(() => {
    if (pubkey) loadIdentityFromPubkey(pubkey);
  }, [pubkey]);

  React.useEffect(() => {
    if (privateKey) initializeFromPrivateKey(privateKey);
  }, [privateKey]);

  return {
    data,
    isLoading,
    createIdentity,
    resetIdentity,
    initializeCustomIdentity,
    initializeFromPrivateKey,
  };
};
