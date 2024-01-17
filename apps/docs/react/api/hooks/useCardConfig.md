---
title: useCardConfig
description: Hook for getting transactions.
---

# useCardConfig

Hook to interact with the cards of an account and modify their configuration

## Import

```ts
import { useCardConfig } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useCardConfig } from '@lawallet/react';
import { config } from './config';

function App() {
  const privateKey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { cards } = useCardConfig({
    privateKey,
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseCardConfigReturns } from '@lawallet/react';
```

### privatekey

`String`

- Private key of the account for which you want to consult the cards

::: code-group

```tsx [index.tsx]
import { useCardConfig } from '@lawallet/react';

function App() {
  const { cards } = useCardConfig({
    privatekey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

### config

`Config | undefined`

[`Config`](/react/api/glossary/types#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useCardConfig } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { transactions } = useCardConfig({
    pubkey: '17efe7a5f1...53936f68b',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type UseCardConfigReturns } from '@lawallet/react';
```

### cards

[`CardsInfo`](/react/api/glossary/types#cardsinfo)

Returns the requested cards info

### toggleCardStatus

`function`

- Function to switch card status
- It receives as a parameter the uuid (string) of the card whose status you want to change.
