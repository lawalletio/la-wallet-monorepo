'use client';

import React, { useState } from 'react';
import type { LNRequestResponse } from '@lawallet/utils/types';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { nip05 } from 'nostr-tools';
import type NDK from '@nostr-dev-kit/ndk';
import { useNostr } from './NostrContext.js';

interface ProfileCacheParameter {}
interface ProfileCacheReturns {
  isLoading: boolean;
  domainAvatars: { [domain: string]: string };
  getNip05: (walias: string) => Promise<NDKUserProfile | null>;
  getLud16: (walias: string) => Promise<LNRequestResponse | null>;
}

const STATIC_LAWALLET_ENDPOINT = 'https://static.lawallet.io'; // TODO: Add it to .env
const FALLBACK_AVATAR_URL = 'https://static.lawallet.io/img/domains/default.png'; // TODO: Add it to .env

export const ProfileCacheContext = React.createContext({} as ProfileCacheReturns);

export function ProfileCacheProvider(props: React.PropsWithChildren<ProfileCacheParameter>) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [domainAvatars, setDomainAvatars] = React.useState<{ [domain: string]: string }>({});

  const { ndk } = useNostr({});

  React.useEffect(() => {
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

  const [nip05Cache] = useState<{ [walias: string]: Promise<NDKUserProfile | null> }>({});
  const [lud16Cache] = useState<{ [walias: string]: Promise<LNRequestResponse | null> }>({});

  const getNip05 = React.useCallback(
    async (walias: string): Promise<NDKUserProfile | null> => {
      if (!nip05Cache[walias]) {
        // console.info(`Cache miss. Generating NIP05 for ${walias}`);
        return (nip05Cache[walias] = resolveNip05(walias, ndk));
      } else {
        // console.info(`NIP05 cache hit for ${walias}`);
        return nip05Cache[walias]!;
      }
    },
    [nip05Cache],
  );

  const getLud16 = React.useCallback(
    async (walias: string): Promise<LNRequestResponse | null> => {
      if (!lud16Cache[walias]) {
        // console.info(`Cache miss. Generating LUD16 for ${walias}`);
        return lud16Cache[walias] || (lud16Cache[walias] = resolveLud16(walias));
      } else {
        // console.info(`LUD16 cache hit for ${walias}`);
        return lud16Cache[walias]!;
      }
    },
    [lud16Cache],
  );

  return React.createElement(
    ProfileCacheContext.Provider,
    {
      value: {
        isLoading,
        domainAvatars,
        getNip05,
        getLud16,
      },
    },
    props.children,
  );
}

export const useProfileCache = (): ProfileCacheReturns => {
  const profile = React.useContext(ProfileCacheContext);
  const { domainAvatars, isLoading, getNip05, getLud16 } = profile;

  return {
    domainAvatars,
    isLoading,
    getNip05,
    getLud16,
  };
};

export async function resolveNip05(walias: string, ndk: NDK): Promise<NDKUserProfile | null> {
  const profile = await nip05.queryProfile(walias);
  if (!profile) {
    return null;
  }

  const user = ndk.getUser({
    pubkey: profile.pubkey,
  });

  return user.fetchProfile();
}

export async function resolveLud16(address: string): Promise<LNRequestResponse | null> {
  const match = address.match(nip05.NIP05_REGEX);
  if (!match) return null;

  const [_, name = '_', domain] = match;

  try {
    const url = `https://${domain}/.well-known/lnurlp/${name}`;
    const res = await (await fetch(url, { redirect: 'error' })).json();
    return res;
  } catch (_e) {
    return null;
  }
}

export async function resolveDomainAvatar(
  address: string,
  domainAvatars: { [domain: string]: string } = {},
): Promise<string> {
  const [, domain] = address.split('@');
  return domainAvatars[domain!] || domainAvatars.default || FALLBACK_AVATAR_URL;
}
