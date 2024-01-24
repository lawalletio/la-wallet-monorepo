import { NDKPrivateKeySigner, type NDKSigner } from '@nostr-dev-kit/ndk';

export const createSignerWithPrivateKey = (nsecOrHexKey: string): NDKSigner | undefined => {
  const signer = new NDKPrivateKeySigner(nsecOrHexKey);
  return signer;
};
