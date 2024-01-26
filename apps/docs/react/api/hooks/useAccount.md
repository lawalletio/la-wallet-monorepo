---
title: useAccount
description: Hook to get all the information of an account
---

# useAccount

Hook to get all the information of an account

## Import

```ts
import { useAccount } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useAccount } from '@lawallet/react';
import { config } from './config';

function App() {
  const { identity, transactions, balance } = useAccount({
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseAccountParameters } from '@lawallet/react';
```

### pubkey

`String | undefined`

- Public key of the user you want to initialize
- If it is not sent, an attempt will be made to load from storage

```tsx [index.tsx]
import { useAccount } from '@lawallet/react';

function App() {
  const { identity, transactions, balance } = useAccount({
    pubkey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

### privateKey

`String | undefined`

- Private key of the account you want to initialize
- If it is not sent, an attempt will be made to load from storage

```tsx [index.tsx]
import { useAccount } from '@lawallet/react';

function App() {
  const { identity, transactions, balance } = useAccount({
    privateKey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

### storage

`Boolean | undefined`

- Defines whether the identity is saved and loaded to/from storage.
- The default parameter is true.

```tsx [index.tsx]
import { useAccount } from '@lawallet/react';

function App() {
  const { identity } = useAccount({
    storage: false // [!code focus]
  });

  useEffect(() = {
    identity.initializeFromPrivateKey('9a9787e...191e28d59') // [!code focus]
  }, [])
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useAccount } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { identity, transactions, balance } = useAccount({
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type UseAccountReturns } from '@lawallet/react';
```

### identity

[`UseIdentityReturns`](/react/api/hooks/useIdentity#return-type)

Returns an instance of the useIdentity() hook

### transactions

[`Transaction[]`](/react/api/glossary/types#transaction)

Returns the account transactions in Transaction format

### balance

[`TokenBalance`](/react/api/glossary/types#tokenbalance)

Return the account balance
