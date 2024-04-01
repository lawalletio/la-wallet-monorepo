import { NextResponse } from 'next/server';

const ADMIN_SIGNUP_KEY: string = process.env.ADMIN_SIGNUP_KEY ?? '';
// const relays: string[] = ['wss://relay.damus.io'];

export async function POST() {
  if (!ADMIN_SIGNUP_KEY.length) return NextResponse.json({ data: 'Missing admin key' }, { status: 401 });

  try {
    // const adminPubkey: string = getPublicKey(ADMIN_SIGNUP_KEY);
    // const ndk: NDK = await initializeNDK(relays, new NDKPrivateKeySigner(ADMIN_SIGNUP_KEY));

    return NextResponse.json({ data: 'ok' }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ data: (e as Error).message }, { status: 422 });
  }
}
