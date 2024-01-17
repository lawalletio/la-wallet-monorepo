import * as React from 'react';
import type NostrExtensionProvider from '../types/nostr.js';
import { type WebLNProvider as WebLNExtensionProvider } from '../types/webln.js';

import NDK, { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

type LightningProvidersType = {
  webln: WebLNExtensionProvider | undefined;
  nostr: NostrExtensionProvider | undefined;
};

type NostrConfig = {
  explicitRelayUrls: string[];
  autoConnect?: boolean;
};

export interface INostr {
  ndk: NDK;
  providers: LightningProvidersType;
  connectNDK: () => Promise<boolean>;
  initializeSigner: (signer: SignerTypes) => void;
}

export type SignerTypes = NDKPrivateKeySigner | NDKNip07Signer | undefined;

export const useNostr = ({ explicitRelayUrls, autoConnect = true }: NostrConfig): INostr => {
  const [ndk] = React.useState<NDK>(
    new NDK({
      explicitRelayUrls,
    }),
  );

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

  const connectNDK = async () => {
    try {
      await ndk.connect();
      return true;
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    loadProviders();

    if (autoConnect) connectNDK();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  return {
    ndk,
    providers,
    connectNDK,
    initializeSigner,
  };
};
