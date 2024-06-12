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
import { nowInSeconds } from '@lawallet/utils';
import type { UnsignedEvent } from 'nostr-tools';

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
  connectNDK: () => Promise<boolean>;
  initializeSigner: (signer: SignerTypes) => void;
  publishEvent: (event: NostrEvent) => Promise<{ success: boolean; error?: string }>;
  signEvent: (event: NostrEvent, signer?: SignerTypes) => Promise<NostrEvent>;
  authWithPrivateKey: (hexKey: string) => Promise<SignerTypes>;
  authWithExtension: () => Promise<SignerTypes>;
  encrypt: (receiverPubkey: string, message: string) => Promise<string>;
  decrypt: (senderPubkey: string, encryptedMessage: string) => Promise<string>;
}

export type SignerTypes = NDKSigner | undefined;

export const useNostrHook = ({
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
  }, []);

  const connectNDK = async () => {
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

      return privateKeySigner;
    } catch {
      return;
    }
  };

  const authWithExtension = async (): Promise<SignerTypes> => {
    try {
      if (!providers.nostr) return undefined;
      await providers.nostr.enable();

      const nip07signer = new NDKNip07Signer();
      initializeSigner(nip07signer);

      return nip07signer;
    } catch {
      return;
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

  const encrypt = React.useCallback(
    async (receiverPubkey: string, message: string): Promise<string> => {
      if (!ndk.signer) return '';

      try {
        const user = new NDKUser({ pubkey: receiverPubkey });
        const encryptedMessage = await ndk.signer!.encrypt(user, message);

        return encryptedMessage;
      } catch {
        return '';
      }
    },
    [ndk.signer],
  );

  const decrypt = React.useCallback(
    async (senderPubkey: string, encryptedMessage: string): Promise<string> => {
      if (!ndk.signer) return '';

      try {
        const user = new NDKUser({ pubkey: senderPubkey });
        const decryptedMessage = await ndk.signer.decrypt(user, encryptedMessage);
        return decryptedMessage;
      } catch {
        return '';
      }
    },
    [ndk.signer],
  );

  const publishEvent = React.useCallback(
    async (event: Partial<NostrEvent>) => {
      try {
        if (!ndk.signer || !signerInfo) throw new Error('You need to initialize a signer to publish an event');

        const eventTemplate: UnsignedEvent = {
          kind: 0,
          content: '',
          created_at: nowInSeconds(),
          tags: [],
          pubkey: signerInfo.pubkey,
          ...event,
        };

        const ndkEvent: NDKEvent = new NDKEvent(ndk, eventTemplate);
        await ndkEvent.sign();
        await ndkEvent.publish();

        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    [ndk.signer],
  );

  React.useEffect(() => {
    loadProviders();

    if (autoConnect) connectNDK();
  }, [autoConnect]);

  React.useEffect(() => {
    if (explicitSigner) initializeSigner(explicitSigner);
  }, [explicitSigner]);

  return {
    ndk,
    signer,
    signerInfo,
    providers,
    connectNDK,
    initializeSigner,
    publishEvent,
    signEvent,
    authWithExtension,
    authWithPrivateKey,
    encrypt,
    decrypt,
  };
};
