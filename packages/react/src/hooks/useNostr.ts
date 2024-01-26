import * as React from 'react';
import type NostrExtensionProvider from '../types/nostr.js';
import { type WebLNProvider as WebLNExtensionProvider } from '../types/webln.js';

import NDK, {
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKUser,
  type NDKSigner,
  type NostrEvent,
  NDKEvent,
} from '@nostr-dev-kit/ndk';

type LightningProvidersType = {
  webln: WebLNExtensionProvider | undefined;
  nostr: NostrExtensionProvider | undefined;
};

type UseNostrParameters = {
  explicitRelayUrls: string[];
  explicitSigner?: NDKSigner;
  autoConnect?: boolean;
};

export interface UseNostrReturns {
  ndk: NDK;
  signer: SignerTypes;
  signerInfo: NDKUser | undefined;
  providers: LightningProvidersType;
  connectRelays: () => Promise<boolean>;
  initializeSigner: (signer: SignerTypes) => void;
  signEvent: (event: NostrEvent, signer?: SignerTypes) => Promise<NostrEvent>;
  authWithPrivateKey: (hexKey: string) => Promise<SignerTypes>;
  authWithExtension: () => Promise<SignerTypes>;
}

export type SignerTypes = NDKSigner | undefined;

export const useNostr = ({
  explicitRelayUrls,
  autoConnect = true,
  explicitSigner = undefined,
}: UseNostrParameters): UseNostrReturns => {
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

  const initializeSigner = async (signer: SignerTypes) => {
    if (!signer) return;
    ndk.signer = signer;

    const user: NDKUser = await signer.user();
    if (user && user.pubkey) setSignerInfo(user);
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
    } catch (err) {
      throw err;
    }
  };

  const authWithPrivateKey = async (hexKey: string): Promise<SignerTypes> => {
    try {
      const privateKeySigner = new NDKPrivateKeySigner(hexKey);
      initializeSigner(privateKeySigner);

      return privateKeySigner;
    } catch (err) {
      throw err;
    }
  };

  const authWithExtension = async (): Promise<SignerTypes> => {
    try {
      if (!providers.nostr) return undefined;
      await providers.nostr.enable();

      const nip07signer = new NDKNip07Signer();
      initializeSigner(nip07signer);

      return nip07signer;
    } catch (err) {
      throw err;
    }
  };

  const signEvent = async (event: NostrEvent, explicitSigner?: SignerTypes): Promise<NostrEvent> => {
    if (!ndk.signer && !explicitSigner) {
      throw new Error('You need to initialize a signer to sign an event');
    }

    const ndkProvider = explicitSigner ? new NDK({ signer: explicitSigner }) : ndk;
    const eventToSign: NDKEvent = new NDKEvent(ndkProvider, event);

    await eventToSign.sign();
    return eventToSign.toNostrEvent();
  };

  React.useEffect(() => {
    loadProviders();

    if (autoConnect) connectRelays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  React.useEffect(() => {
    if (explicitSigner) initializeSigner(explicitSigner);
  }, [explicitSigner]);

  return {
    ndk,
    signer,
    signerInfo,
    providers,
    connectRelays,
    initializeSigner,
    signEvent,
    authWithExtension,
    authWithPrivateKey,
  };
};
