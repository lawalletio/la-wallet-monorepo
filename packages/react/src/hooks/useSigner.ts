import { NDKPrivateKeySigner, NDKNip07Signer, NDKUser } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NostrContext.js';
import type { SignerTypes } from './useNostr.js';

export type UseSignerReturns = {
  signer: SignerTypes;
  signerPubkey: string;
  connectWithExtension: () => void;
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

  const connectWithExtension = async (): Promise<SignerTypes> => {
    if (!providers.webln) return undefined;
    await providers.webln.enable();

    const nip07signer = new NDKNip07Signer();
    initializeSigner(nip07signer);

    const pubKey = await requestPublicKey();
    if (pubKey) setSignerPubkey(pubKey);

    return nip07signer;
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
    connectWithExtension,
    connectWithPrivateKey,
    requestPublicKey,
  };
};
