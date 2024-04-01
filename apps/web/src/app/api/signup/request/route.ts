import { ADMIN_SIGNUP_KEY, msats_signupPrice, signupPubkey, signupRelays } from '@/constants/buyAddress';
import { initializeNDK, signNdk } from '@/utils/ndk';
import { baseConfig, buildBuyHandleRequest, buildZapRequestEvent } from '@lawallet/react';
import { requestInvoice } from '@lawallet/react/actions';
import NDK, { NDKPrivateKeySigner, NostrEvent } from '@nostr-dev-kit/ndk';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getPublicKey, nip04, nip19 } from 'nostr-tools';

export async function GET() {
  if (!ADMIN_SIGNUP_KEY.length) return NextResponse.json({ data: 'Missing admin key' }, { status: 401 });

  try {
    const adminPubkey: string = getPublicKey(ADMIN_SIGNUP_KEY);
    const randomNonce: string = randomBytes(32).toString('hex');

    console.log(randomNonce);

    const encryptedNonce: string = await nip04.encrypt(ADMIN_SIGNUP_KEY, adminPubkey, randomNonce);
    const ndk: NDK = await initializeNDK(signupRelays, new NDKPrivateKeySigner(ADMIN_SIGNUP_KEY));

    /* Buy Handle Request Event */
    const buyReqEvent: NostrEvent = await signNdk(ndk, buildBuyHandleRequest(adminPubkey, encryptedNonce), true);

    /* Zap Request Event */
    const zapRequestEvent: NostrEvent | undefined = await signNdk(
      ndk,
      buildZapRequestEvent(adminPubkey, signupPubkey, msats_signupPrice, baseConfig, [['e', buyReqEvent.id!]]),
    );

    const zapRequestURI: string = encodeURI(JSON.stringify(zapRequestEvent));

    const bolt11 = await requestInvoice(
      `${baseConfig.endpoints.gateway}/lnurlp/${nip19.npubEncode(signupPubkey)}/callback?amount=${msats_signupPrice}&nostr=${zapRequestURI}`,
    );

    return NextResponse.json({ zapRequest: JSON.stringify(zapRequestEvent), invoice: bolt11 }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ data: (e as Error).message }, { status: 422 });
  }
}
