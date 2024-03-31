import { useContext, useEffect, useState } from 'react';
import { useNostrContext } from '../context/NostrContext.js';
import { NIP05_REGEX, queryProfile } from 'nostr-tools/nip05';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import type { LNRequestResponse } from '../exports/types.js';
import { useProfileCache } from '../context/ProfileCacheContext.js';

const FALLBACK_AVATAR_URL = 'https://static.lawallet.io/img/domains/default.png'; // TODO: Add it to .env

export interface UseProfileConfig {}

export interface UseProfileParams {
  walias?: string;
  pubkey?: string;
}

export interface UseProfileReturns {
  nip05?: NDKUserProfile;
  lud16?: LNRequestResponse;
  lud16Avatar?: string;
  nip05Avatar?: string;
  domainAvatar: string;
  isLoading: boolean;
}

export const useProfile = (
  { walias, pubkey: _pubkey }: UseProfileParams,
  options?: UseProfileConfig,
): UseProfileReturns => {
  // Hooks
  const { ndk } = useNostrContext({});
  const profile = useProfileCache();
  const { domainAvatars, isLoading: isDomainAvatarLoading } = profile;

  // Global loading
  const [isLoading, setIsLoading] = useState(true);

  // Individual loading
  const [isNip05Loading, setIsNip05Loading] = useState(true);
  const [isLud16Loading, setIsLud16Loading] = useState(true);

  // Data
  const [pubkey, setPubkey] = useState<string | undefined>(_pubkey);
  const [nip05, setNip05] = useState<NDKUserProfile | undefined>();
  const [lud16, setLud16] = useState<LNRequestResponse | undefined>();
  const [lud16Avatar, setLud16Avatar] = useState<string | undefined>();
  const [nip05Avatar, setNip05Avatar] = useState<string | undefined>();
  const [domainAvatar, setDomainAvatar] = useState<string>(FALLBACK_AVATAR_URL);

  // Marge all loadings into isLoading
  useEffect(() => {
    if (isNip05Loading || isLud16Loading || isDomainAvatarLoading) {
      return;
    }

    setIsLoading(false);
  }, [isNip05Loading, isLud16Loading, isDomainAvatarLoading]);

  // Resolve NIP05 Pubkey and LUD16
  useEffect(() => {
    if (!walias) {
      return;
    }

    resolveNip05(walias).then((pubkey) => {
      if (!pubkey) {
        setIsNip05Loading(false);
        return;
      }
      setPubkey(pubkey);
    });

    resolveLud16(walias)
      .then((lud16) => {
        if (!lud16) {
          return;
        }

        const metadata = JSON.parse(lud16.metadata) || [];
        setLud16Avatar(metadata.find((tag: string[]) => tag[0] === 'image/avatar')?.[1]);
        setLud16(lud16);
      })
      .finally(() => setIsLud16Loading(false));
  }, [walias]);

  // Fetch NIP05 pubkey metadata
  useEffect(() => {
    if (!pubkey) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const user = ndk.getUser({
          pubkey: pubkey,
        });

        const profile = await user.fetchProfile();
        if (profile) {
          setNip05Avatar(profile.image);
        }
        setNip05(profile || undefined);
      } finally {
        setIsNip05Loading(false);
      }
    };

    fetchProfile();
  }, [pubkey]);

  // Fetch domain avatar
  useEffect(() => {
    if (!walias) {
      return;
    }
    resolveDomainAvatar(walias, domainAvatars).then(setDomainAvatar);
  }, [walias, domainAvatars]);

  // useProfile return
  return {
    isLoading,
    nip05,
    lud16,
    nip05Avatar,
    lud16Avatar,
    domainAvatar,
  };
};

export async function resolveNip05(address: string): Promise<string | undefined> {
  const profile = await queryProfile(address);
  if (!profile) {
    return;
  }
  return profile.pubkey;
}

export async function resolveLud16(address: string): Promise<LNRequestResponse | undefined> {
  const match = address.match(NIP05_REGEX);
  if (!match) return;

  const [_, name = '_', domain] = match;

  try {
    const url = `https://${domain}/.well-known/lnurlp/${name}`;
    const res = await (await fetch(url, { redirect: 'error' })).json();
    return res;
  } catch (_e) {
    return;
  }
}

export async function resolveDomainAvatar(
  address: string,
  domainAvatars: { [domain: string]: string } = {},
): Promise<string> {
  const [, domain] = address.split('@');
  return domainAvatars[domain!] || domainAvatars.default || FALLBACK_AVATAR_URL;
}
