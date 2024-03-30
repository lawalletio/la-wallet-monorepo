import { useState, createContext, type PropsWithChildren, createElement, useEffect, useCallback } from 'react';
import type { LNRequestResponse } from '../exports/types.js';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

interface ProfileCacheParameter {}
interface ProfileCacheReturns {
  isLoading: boolean;
  domainAvatars: { [domain: string]: string };
  waliasCache: WaliasCache;
  updateCache: (walias: string, data: WaliasCache) => void;
}

const STATIC_LAWALLET_ENDPOINT = 'https://static.lawallet.io'; // TODO: Add it to .env

export const ProfileCacheContext = createContext({} as ProfileCacheReturns);

export interface ProfileData {
  lud16?: LNRequestResponse;
  nip05?: NDKUserProfile;
  lud16Avatar5?: string;
  nip05Avatar?: string;
  defaultAvatar?: string;
  expiry: number;
}

export type WaliasCache = {
  [walias: string]: ProfileData;
};

export function ProfileCacheProvider({ children }: PropsWithChildren<ProfileCacheParameter>) {
  const [isLoading, setIsLoading] = useState(true);
  const [domainAvatars, setDomainAvatars] = useState<{ [domain: string]: string }>({});
  const [waliasCache, setWaliasCache] = useState<WaliasCache>({});

  useEffect(() => {
    fetch(`${STATIC_LAWALLET_ENDPOINT}/domains.json`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        for (let key in data) {
          data[key] = `${STATIC_LAWALLET_ENDPOINT}/${data[key]}`;
        }
        return data;
      })
      .then(setDomainAvatars)
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const updateCache = useCallback((walias: string, data: WaliasCache) => {
    setWaliasCache((prev: any) => {
      return {
        ...prev,
        [walias]: data,
      };
    });
  }, []);

  return createElement(
    ProfileCacheContext.Provider,
    {
      value: {
        isLoading,
        domainAvatars,
        waliasCache,
        updateCache,
      },
    },
    children,
  );
}
