import { initializeNDK, signNdk } from '@/utils/ndk';
import { baseConfig, buildBuyHandleRequest, buildZapRequestEvent } from '@lawallet/react';
import { requestInvoice } from '@lawallet/react/actions';
import NDK, { NDKPrivateKeySigner, NostrEvent } from '@nostr-dev-kit/ndk';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getPublicKey, nip04, nip19 } from 'nostr-tools';

const ADMIN_SIGNUP_KEY: string = process.env.ADMIN_SIGNUP_KEY ?? '';
const relays: string[] = ['wss://relay.damus.io'];
const receiverPubkey: string = '6aee4c2218052d665c07622a2beff87df017dfef351267cc8db17471fbb18a64'; //tesoro@lawallet.ar
const msats_addressPrice: number = 21000; // 21 sats

export async function GET() {
  if (!ADMIN_SIGNUP_KEY.length) return NextResponse.json({ data: 'Missing admin key' }, { status: 401 });

  try {
    const adminPubkey: string = getPublicKey(ADMIN_SIGNUP_KEY);
    const encryptedNonce: string = await nip04.encrypt(ADMIN_SIGNUP_KEY, adminPubkey, randomBytes(32).toString('hex'));
    const ndk: NDK = await initializeNDK(relays, new NDKPrivateKeySigner(ADMIN_SIGNUP_KEY));

    /* Buy Handle Request Event */
    const buyReqEvent: NostrEvent = await signNdk(ndk, buildBuyHandleRequest(adminPubkey, encryptedNonce), true);

    /* Zap Request Event */
    const zapRequestEvent: NostrEvent | undefined = await signNdk(
      ndk,
      buildZapRequestEvent(adminPubkey, receiverPubkey, msats_addressPrice, baseConfig, [['e', buyReqEvent.id!]]),
    );

    const zapRequestURI: string = encodeURI(JSON.stringify(zapRequestEvent));

    const bolt11 = await requestInvoice(
      `${baseConfig.endpoints.gateway}/lnurlp/${nip19.npubEncode(receiverPubkey)}/callback?amount=${msats_addressPrice}&nostr=${zapRequestURI}`,
    );

    return NextResponse.json({ zapRequest: JSON.stringify(zapRequestEvent), invoice: bolt11 }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ data: (e as Error).message }, { status: 422 });
  }
}
