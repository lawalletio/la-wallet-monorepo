import { NDKPrivateKeySigner, type NDKNip07Signer, NDKUser } from '@nostr-dev-kit/ndk';
import * as React from 'react';
import { useNostrContext } from '../context/NDKContext.js';

type SignerTypes = NDKPrivateKeySigner | NDKNip07Signer | undefined;

export type UseSignerReturns = {
  signer: SignerTypes;
  signerPubkey: string;
  connectExtension: () => void;
  connectWithPrivateKey: (hexKey: string) => Promise<boolean>;
};

export const useSigner = () => {
  const { providers } = useNostrContext();
  const [signer, setSigner] = React.useState<SignerTypes>();
  const [signerPubkey, setSignerPubkey] = React.useState<string>('');

  const connectWithPrivateKey = async (hexKey: string): Promise<boolean> => {
    try {
      const privateKeySigner = new NDKPrivateKeySigner(hexKey);
      setSigner(privateKeySigner);

      const user: NDKUser = await privateKeySigner.user();
      if (user && user.pubkey) setSignerPubkey(user.pubkey);

      return true;
    } catch {
      return false;
    }
  };

  const connectExtension = async () => {
    if (!providers.webln) return null;
    await providers.webln.enable();

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
