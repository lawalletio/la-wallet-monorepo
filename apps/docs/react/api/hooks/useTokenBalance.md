---
title: useTokenBalance
description: Hook for getting balance.
---

# useTokenBalance

Hook to get the balance of an account

## Import

```ts
import { useTokenBalance } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';
import { config } from './config';

function App() {
  const userPubkey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { balance } = useTokenBalance({
    pubkey: userPubkey,
    tokenId: 'BTC',
    enabled: Boolean(userPubkey.length),
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseTokenBalanceParameters } from '@lawallet/react';
```

### pubkey

`String`

- Public key of the account for which you want to consult the balance

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';

function App() {
  const { balance } = useTokenBalance({
    pubkey: '17efe7a5f1...53936f68b', // [!code focus]
    tokenId: 'BTC',
  });
}
```

:::

### tokenId

`String`

- Id of the token to be transferred

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';

function App() {
  const { balance } = useTokenBalance({
    pubkey: '17efe7a5f1...53936f68b',
    tokenId: 'BTC', // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

### enabled

`Boolean | undefined`

- Set this to false to disable this query from automatically running.
- The default parameter is true.

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';

function App() {
  const { balance } = useTokenBalance({
    pubkey: '17efe7a5f1...53936f68b',
    tokenId: 'BTC',
    enabled: false, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { balance } = useTokenBalance({
    pubkey: '17efe7a5f1...53936f68b',
    tokenId: 'BTC',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type UseTokenBalanceReturns } from '@lawallet/react';
```

### balance

[`TokenBalance`](/react/api/glossary/types#TokenBalance)

Returns the requested account and token balance information
