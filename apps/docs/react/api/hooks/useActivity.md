---
title: useActivity
description: Hook for getting transactions.
---

# useActivity

Hook to get the transactions of an account

## Import

```ts
import { useActivity } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';
import { config } from './config';

function App() {
  const userPubkey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { transactions } = useActivity({
    pubkey: userPubkey,
    enabled: Boolean(userPubkey.length),
    limit: 100,
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseActivityReturns } from '@lawallet/react';
```

### pubkey

`String`

- Public key of the account for which you want to consult the transactions

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

:::

### since

`Number | undefined`

- Since when do you start listening to transactions

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    since: Math.floor(Date.now() / 1000), // [!code focus]
  });
}
```

:::

### until

`Number | undefined`

- Until when to listen to transactions

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    until: Math.floor(Date.now() / 1000), // [!code focus]
  });
}
```

:::

### limit

`Number | undefined`

- Limit of transactions to listen
- The default parameter is 1000.

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    limit: 250, // [!code focus]
  });
}
```

:::

### storage

`Boolean | undefined`

- Defines whether listened transactions are saved in storage.
- The default parameter is false.

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    storage: true, // [!code focus]
  });
}
```

:::

### enabled

`Boolean | undefined`

- Set this to false to disable this query from automatically running.
- The default parameter is true.

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    enabled: false, // [!code focus]
  });
}
```

:::

### config

`Config | undefined`

[`Config`](/react/api/glossary/types#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useActivity } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { transactions } = useActivity({
    pubkey: '17efe7a5f1...53936f68b',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type useActivityReturns } from '@lawallet/react';
```

### transactions

[`Transaction`](/react/api/glossary/types#transaction)

Returns the requested transactions in Transaction format
