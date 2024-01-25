---
title: useCards
description: Hook for getting transactions
---

# useCards

Hook to interact with the cards of an account and modify their configuration

## Import

```ts
import { useCards } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useCards } from '@lawallet/react';
import { config } from './config';

function App() {
  const privateKey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { cards } = useCards({
    privateKey,
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseCardsParameters } from '@lawallet/react';
```

### privateKey

`String`

- Private key of the account for which you want to consult the cards

```tsx [index.tsx]
import { useCards } from '@lawallet/react';

function App() {
  const { cards } = useCards({
    privatekey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useCards } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { transactions } = useCards({
    pubkey: '17efe7a5f1...53936f68b',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type UseCardsReturns } from '@lawallet/react';
```

### cardsData

[`CardDataPayload`](/react/api/glossary/types#cardsdatapayload)

Returns the requested cards data

### cardsConfig

[`CardConfigPayload`](/react/api/glossary/types#cardsdatapayload)

Returns the requested cards config

### toggleCardStatus

`(uuid: string) => Promise<boolean>`

- Function to switch card status
- It receives as a parameter the uuid (string) of the card whose status you want to change.

### updateCardConfig

`(uuid: string, config: CardPayload) => Promise<boolean>`
See [`CardPayload`](/react/api/glossary/types#cardpayload)

-Function that changes the configuration of a card

- Receives as a parameter the uuid (string) of the card whose status you want to change and the new configuration for this card (CardPayload)