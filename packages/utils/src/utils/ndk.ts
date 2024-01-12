import { NDKEvent, type NDKNip07Signer, type NDKPrivateKeySigner, type NostrEvent } from '@nostr-dev-kit/ndk';
import NDK from '@nostr-dev-kit/ndk';

export async function SignEvent(signer: NDKPrivateKeySigner | NDKNip07Signer, event: NostrEvent) {
  try {
    const ndk = new NDK({ signer });
    const eventToSign: NDKEvent = new NDKEvent(ndk, event);

    await eventToSign.sign();
    return eventToSign.toNostrEvent();
  } catch {
    return undefined;
  }
}
