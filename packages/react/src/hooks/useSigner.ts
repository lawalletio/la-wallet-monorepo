import { NDKPrivateKeySigner, NDKNip07Signer, NDKUser } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NDKContext.js';
import type { SignerTypes } from './useNostr.js';

export type UseSignerReturns = {
  signer: SignerTypes;
  signerPubkey: string;
  connectExtension: () => void;
  connectWithPrivateKey: (hexKey: string) => Promise<boolean>;
};

export const useSigner = () => {
  const {
    ndk: { signer },
    initializeSigner,
    providers,
  } = useNostrContext();

  const [signerPubkey, setSignerPubkey] = React.useState<string>('');

  const connectWithPrivateKey = async (hexKey: string): Promise<SignerTypes> => {
    try {
      const privateKeySigner = new NDKPrivateKeySigner(hexKey);
      initializeSigner(privateKeySigner);

      const user: NDKUser = await privateKeySigner.user();
      if (user && user.pubkey) setSignerPubkey(user.pubkey);

      return privateKeySigner;
    } catch {
      return undefined;
    }
  };

  const connectExtension = async () => {
    if (!providers.webln) return null;
    await providers.webln.enable();

    const nip07signer = new NDKNip07Signer();
    initializeSigner(nip07signer);

    const pubKey = await requestPublicKey();
    if (pubKey) setSignerPubkey(pubKey);
  };

  const requestPublicKey = async () => {
    if (!providers.nostr) return '';

    try {
      await providers.nostr.enable();
      const _pubKey = await providers.nostr.getPublicKey();
      return _pubKey;
    } catch {
      return '';
    }
  };

  return {
    signer,
    signerPubkey,
    connectExtension,
    connectWithPrivateKey,
    requestPublicKey,
  };
};
