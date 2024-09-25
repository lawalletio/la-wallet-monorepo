'use client';

import * as React from 'react';
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import type { LNRequestResponse } from '@lawallet/utils/types';
import { resolveDomainAvatar, useProfileCache } from '../context/ProfileCacheContext.js';
import { useLaWallet } from '../context/WalletContext.js';

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
  isNip05Loading: boolean;
  isLud16Loading: boolean;
  isDomainAvatarLoading: boolean;
  loadProfileFromPubkey: (pubkey: string) => void;
}

export const useProfile = (params?: UseProfileParams, _options?: UseProfileConfig): UseProfileReturns => {
  if (!params) {
    const context = useLaWallet();

    if (!context)
      throw new Error(
        'If you do not send parameters to the hook, it must have a LaWalletConfig context from which to obtain the information.',
      );

    return context.profile;
  }

  const { walias, pubkey } = params;

  // Hooks
  const { domainAvatars, isLoading: isDomainAvatarLoading, getNip05, getLud16, getProfile } = useProfileCache();

  // Global loading
  const [isLoading, setIsLoading] = React.useState(true);

  // Individual loading
  const [isNip05Loading, setIsNip05Loading] = React.useState(false);
  const [isLud16Loading, setIsLud16Loading] = React.useState(false);

  // Data
  const [nip05, setNip05] = React.useState<NDKUserProfile | undefined>();
  const [lud16, setLud16] = React.useState<LNRequestResponse | undefined>();
  const [lud16Avatar, setLud16Avatar] = React.useState<string | undefined>();
  const [nip05Avatar, setNip05Avatar] = React.useState<string | undefined>();
  const [domainAvatar, setDomainAvatar] = React.useState<string>(FALLBACK_AVATAR_URL);

  // Marge all loadings into isLoading
  React.useEffect(() => {
    if (isNip05Loading || isLud16Loading || isDomainAvatarLoading) {
      return;
    }

    setIsLoading(false);
  }, [isNip05Loading, isLud16Loading, isDomainAvatarLoading]);

  // Resolve NIP05 Pubkey and LUD16
  React.useEffect(() => {
    if (!walias) {
      return;
    }

    setIsNip05Loading(true);
    setIsLud16Loading(true);

    // Get NIP05
    getNip05(walias)
      .then((profile) => {
        if (!profile) {
          return;
        }

        setNip05Avatar(profile.image);
        setNip05(profile);
      })
      .finally(() => setIsNip05Loading(false));

    // Get LUD16
    getLud16(walias)
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

  const loadProfileFromPubkey = (pubkey: string) => {
    setIsNip05Loading(true);

    getProfile(pubkey)
      .then((profile) => {
        if (!profile) {
          return;
        }

        setNip05Avatar(profile.image);
        setNip05(profile);
      })
      .finally(() => setIsNip05Loading(false));
  };

  React.useEffect(() => {
    if (!pubkey) {
      return;
    }

    loadProfileFromPubkey(pubkey);
  }, [pubkey]);

  // Fetch domain avatar
  React.useEffect(() => {
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
    isNip05Loading,
    isLud16Loading,
    isDomainAvatarLoading,
    loadProfileFromPubkey,
  };
};
