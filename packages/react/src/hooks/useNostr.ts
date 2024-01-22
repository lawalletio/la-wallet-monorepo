import * as React from 'react';
import type NostrExtensionProvider from '../types/nostr.js';
import { type WebLNProvider as WebLNExtensionProvider } from '../types/webln.js';

import NDK, { NDKNip07Signer, NDKPrivateKeySigner, NDKUser, type NDKSigner } from '@nostr-dev-kit/ndk';

type LightningProvidersType = {
  webln: WebLNExtensionProvider | undefined;
  nostr: NostrExtensionProvider | undefined;
};

type UseNostrParameters = {
  explicitRelayUrls: string[];
  autoConnect?: boolean;
};

export interface UseNostrReturns {
  ndk: NDK;
  signer: SignerTypes;
  signerInfo: NDKUser | undefined;
  providers: LightningProvidersType;
  connectRelays: () => Promise<boolean>;
  initializeSigner: (signer: SignerTypes) => void;
  authWithPrivateKey: (hexKey: string) => Promise<SignerTypes>;
  authWithExtension: () => Promise<SignerTypes>;
}

export type SignerTypes = NDKSigner | undefined;

export const useNostr = ({ explicitRelayUrls, autoConnect = true }: UseNostrParameters): UseNostrReturns => {
  const [ndk] = React.useState<NDK>(
    new NDK({
      explicitRelayUrls,
    }),
  );

  const signer: SignerTypes = React.useMemo(() => ndk.signer, [ndk.signer]);
  const [signerInfo, setSignerInfo] = React.useState<NDKUser | undefined>(undefined);

  const [providers, setProviders] = React.useState<LightningProvidersType>({
    webln: undefined,
    nostr: undefined,
  });

  const initializeSigner = (signer: SignerTypes) => {
    if (!signer) return;
    ndk.signer = signer;
  };

  const loadProviders = React.useCallback(async () => {
    setProviders({
      webln: window.webln,
      nostr: window.nostr as NostrExtensionProvider,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectRelays = async () => {
    try {
      await ndk.connect();
      return true;
    } catch {
      return false;
    }
  };

  const authWithPrivateKey = async (hexKey: string): Promise<SignerTypes> => {
    try {
      const privateKeySigner = new NDKPrivateKeySigner(hexKey);
      initializeSigner(privateKeySigner);

      const user: NDKUser = await privateKeySigner.user();
      if (user && user.pubkey) setSignerInfo(user);

      return privateKeySigner;
    } catch {
      return undefined;
    }
  };

  const authWithExtension = async (): Promise<SignerTypes> => {
    try {
      if (!providers.nostr) return undefined;
      await providers.nostr.enable();

      const nip07signer = new NDKNip07Signer();
      initializeSigner(nip07signer);

      const user = await nip07signer.user();
      if (user) setSignerInfo(user);

      return nip07signer;
    } catch {
      return undefined;
    }
  };

  React.useEffect(() => {
    loadProviders();

    if (autoConnect) connectRelays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  return {
    ndk,
    signer,
    signerInfo,
    providers,
    connectRelays,
    initializeSigner,
    authWithExtension,
    authWithPrivateKey,
  };
};
