---
title: useIdentity
description: Hook to use an Identity instance
---

# useIdentity

Hook to use an Identity instance

## Import

```ts
import { useIdentity } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useIdentity } from '@lawallet/react';
import { config } from './config';

function App() {
  const { identity } = useIdentity({
    privateKey: '17efe7a5f1...53936f68b',
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseIdentityParameters } from '@lawallet/react';
```

### privateKey

`String | undefined`

- Private key of the account for which you want to check the identity
- If it is not sent, an attempt will be made to load from storage

```tsx [index.tsx]
import { useIdentity } from '@lawallet/react';

function App() {
  const { identity } = useIdentity({
    privateKey: '9a9787e...191e28d59', // [!code focus]
  });
}
```

### storage

`Boolean | undefined`

- Defines whether the identity is saved and loaded to/from storage.
- The default parameter is true.

```tsx [index.tsx]
import { useIdentity } from '@lawallet/react';

function App() {
  const { identity, initializeFromPrivateKey } = useIdentity({
    storage: false // [!code focus]
  });

  useEffect(() = {
    initializeFromPrivateKey('9a9787e...191e28d59')
  }, [])
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useIdentity } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { identity } = useIdentity({
    privateKey: '17efe7a5f1...53936f68b',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type UseIdentityReturns } from '@lawallet/react';
```

### data

[`UserIdentity`](/react/api/glossary/types#useridentity)

Returns an instance of the Identity

### isLoading

`boolean`

Returns a boolean that identifies whether the identity is being loaded

### initializeFromPrivateKey

`(privateKey: string) => Promise<boolean>`

- Load an identity from your private key
- Returns a boolean variable that validates whether it was executed correctly

### initializeCustomIdentity

`(privateKey: string, username: string) => Promise<boolean>`

- Set an identity with the defined username
- Returns a boolean variable that validates whether it was executed correctly

### createIdentity

`({ nonce: string, name: string }) => Promise<CreateIdentityReturns>`

- Function that creates a new identity
- Returns an object of type [`CreateIdentityReturns`](/react/api/glossary/types#createidentityreturns)

### resetIdentity

`() => void`

- Set the identity to default parameters (empty)
