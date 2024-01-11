import * as React from "react";
import type NostrExtensionProvider from "../types/nostr.js";
import { type WebLNProvider as WebLNExtensionProvider } from "../types/webln.js";

import NDK, {
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKUser,
} from "@nostr-dev-kit/ndk";

type LightningProvidersType = {
  webln: WebLNExtensionProvider | undefined;
  nostr: NostrExtensionProvider | undefined;
};

export interface INostr {
  ndk: NDK;
  providers: LightningProvidersType;
  connectExtension: () => void;
  connectWithPrivateKey: (hexKey: string) => Promise<boolean>;
  requestPublicKey: () => Promise<string>;
  userPubkey: string;
}

export const useNOSTR = (explicitRelayUrls: string[]): INostr => {
  const [ndk, setNDK] = React.useState<NDK>(
    new NDK({
      explicitRelayUrls,
    }),
  );

  const [userPubkey, setUserPubkey] = React.useState<string>("");

  const [providers, setProviders] = React.useState<LightningProvidersType>({
    webln: undefined,
    nostr: undefined,
  });

  const loadProviders = React.useCallback(async () => {
    setProviders({
      webln: window.webln,
      nostr: window.nostr as NostrExtensionProvider,
    });

    // if (window.nostr) {
    //   const nip07signer = new NDKNip07Signer();
    //   const ndkProvider = new NDK({
    //     explicitRelayUrls,
    //     signer: nip07signer,
    //   });

    //   setNDK(ndkProvider);
    //   await ndkProvider.connect();
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeNDK = async (
    signer: NDKNip07Signer | NDKPrivateKeySigner,
  ) => {
    try {
      const ndkProvider = new NDK({
        explicitRelayUrls,
        signer,
      });

      setNDK(ndkProvider);
      await ndkProvider.connect();
      return true;
    } catch {
      return false;
    }
  };

  const connectWithPrivateKey = async (hexKey: string): Promise<boolean> => {
    try {
      const privateKeySigner = new NDKPrivateKeySigner(hexKey);
      const ndkInitialized: boolean = await initializeNDK(privateKeySigner);

      const user: NDKUser = await privateKeySigner.user();
      if (user && user.pubkey) setUserPubkey(user.pubkey);

      return ndkInitialized;
    } catch {
      return false;
    }
  };

  const connectExtension = async () => {
    if (!providers.webln) return null;
    await providers.webln.enable();

    const pubKey = await requestPublicKey();
    if (pubKey) setUserPubkey(pubKey);
  };

  const requestPublicKey = async () => {
    if (!providers.nostr) return "";

    try {
      await providers.nostr.enable();
      const _pubKey = await providers.nostr.getPublicKey();
      return _pubKey;
    } catch {
      return "";
    }
  };

  React.useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ndk,
    providers,
    connectExtension,
    connectWithPrivateKey,
    userPubkey,
    requestPublicKey,
  };
};
