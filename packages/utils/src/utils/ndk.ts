import NDK, { NDKEvent, type NDKSigner, type NostrEvent } from '@nostr-dev-kit/ndk';

export async function SignEvent(signer: NDKSigner, event: NostrEvent) {
  try {
    const ndk = new NDK({ signer });
    const eventToSign: NDKEvent = new NDKEvent(ndk, event);

    await eventToSign.sign();
    return eventToSign.toNostrEvent();
  } catch {
    return undefined;
  }
}
