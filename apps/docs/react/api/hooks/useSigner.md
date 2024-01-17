---
title: useSigner
description: Hook to get or initialize the nostr signer
---

# useSigner

Hook to get or initialize the nostr signer

## Import

```ts
import { useSigner } from '@lawallet/react';
```

## Usage

```tsx [index.tsx]
import { useSigner } from '@lawallet/react';

function App() {
  const { signer, connectWithExtension, connectWithPrivateKey } = useSigner();
}
```

## Return Type

```ts
import { type useSignerReturns } from '@lawallet/react';
```

### signer

[`SignerTypes`](/react/api/glossary/types#signertypes)

Returns an instance of the signer

### signerPubkey

`string`

Returns the signer's public key

### connectWithPrivateKey

`(hexKey: string): Promise`[`<SignerTypes>`](/react/api/glossary/types#signertypes)

- This function is used to initialize a signer with a private key.
- Receives the private key per parameter in hexadecimal or nsec format.

### connectWithExtension

`(): Promise`[`<SignerTypes>`](/react/api/glossary/types#signertypes)

- This function is used to initialize a signer with Alby extension.
- Returns undefined if the extension does not exist in the browser
