---
title: useTokenBalance
description: Hook for getting balance.
---

# useTokenBalance

Hook for getting current account.

## Import

```ts
import { useTokenBalance } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';

function App() {
  const userPubkey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { balance } = useTokenBalance({
    pubkey: userPubkey,
    tokenId: 'BTC',
    enabled: Boolean(userPubkey.length),
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseTokenBalanceParameters } from '@lawallet/react';
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useTokenBalance } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { balance } = useTokenBalance({
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
