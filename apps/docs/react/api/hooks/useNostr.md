---
title: useNostr
description: Hook to use connections to Nostr
---

# useNostr

Hook to use connections to Nostr

## Import

```ts
import { useNostr } from '@lawallet/react';
```

## Usage

```tsx [index.tsx]
import { useNostr } from '@lawallet/react';

function App() {
  const { ndk, connectRelays } = useNostr({
    explicitRelayUrls: ['wss://relay.lawallet.ar'],
  });
}
```

## Parameters

```ts
import { type UseNostrParameters } from '@lawallet/react';
```

### explicitRelayUrls

`String[]`

- Array of relay links to connect

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { ndk, connectRelays } = useNostr({
    explicitRelayUrls: ['wss://relay.lawallet.ar'], // [!code focus]
  });
}
```

### autoConnect

`Boolean | undefined`

- Set this to false to disable automatic connection of relays.
- The default parameter is true.

```tsx [index.tsx]
import { useNostr } from '@lawallet/react';

function App() {
  const { ndk, connectRelays } = useNostr({
    explicitRelayUrls: ['wss://relay.lawallet.ar'],
    autoConnect: false // [!code focus]
  });

  useEffect(() = {
    connectRelays()
  }, [])
}
```

## Return Type

```ts
import { type useNostrReturns } from '@lawallet/react';
```

### ndk

[`NDK`](/react/api/glossary/ndk#ndk)

Returns an instance of the NDK

### signer

Returns an instance of the NDKSigner(/react/api/glossary/ndk#ndksigner)

### signerInfo

Returns an instance of the NDKUser(/react/api/glossary/ndk#ndkuser)

### providers

[`LightningProvidersType`](/react/api/glossary/types#LightningProvidersType)

Returns the `window.ln` and `window.nostr` browser instances

### connectRelays

`() => Promise<boolean>`

- This function executes the connection to the relays
- Returns a boolean variable that validates whether it was executed correctly

### initializeSigner

`(signer: SignerTypes): void`
[`<SignerTypes>`](/react/api/glossary/types#signertypes)

- This function sets the signing user of the NDK instance.
- Use UseSigner to access it if you are within the LaWalletConfig context

### authWithPrivateKey

`(signer: SignerTypes): Promise<SignerTypes>`
[`<SignerTypes>`](/react/api/glossary/types#signertypes)

- This function authenticates a signer with a private key
- Returns an instance of NDKSigner

### authWithExtension

`(): Promise<SignerTypes>`
[`<SignerTypes>`](/react/api/glossary/types#signertypes)

- This function authenticates a signer with [`NIP07`](https://github.com/nostr-protocol/nips/blob/master/07.md)
- Returns an instance of NDKSigner
