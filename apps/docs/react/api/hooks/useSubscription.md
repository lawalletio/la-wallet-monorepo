---
title: useSubscription
description: Hook to create a Nostr subscription.
---

# useSubscription

Hook to create a Nostr subscription

## Import

```ts
import { useSubscription } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useSubscription } from '@lawallet/react';

function App() {
  const userPubkey: string = '9a9787e3e31c...20f63546b191e28d59';

  const { subscription, events } = useSubscription({
    filters: {
      [
        authors: [userPubkey]
        kinds: [1],
      ]
    },
    options: {
      closeOnEose: true
    },
    enabled: true,
    config
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type useSubscriptionParameters } from '@lawallet/react';
```

### filters

[`NDKFilter[]`](/react/api/glossary/ndk#ndkfilter)

- Array of filters for the subscription you want to start

```tsx [index.tsx]
import { useSubscription } from '@lawallet/react';

function App() {
  const { subscription, events } = useSubscription({
    filters: { // [!code focus]
      [ // [!code focus]
        authors: ['9a9787e...e28d59'] // [!code focus]
        kinds: [1], // [!code focus]
      ] // [!code focus]
    }, // [!code focus]
    options: {
      closeOnEose: true
    },
    enabled: true
  });
}
```

### options

[`NDKSubscriptionOptions`](/react/api/glossary/ndk#ndksubscriptionoptions)

- Options for the subscription you want to start

```tsx [index.tsx]
import { useSubscription } from '@lawallet/react';
import { config } from './config';

function App() {
  const { subscription, events } = useSubscription({
    filters: {
      [
        authors: ['9a9787e...e28d59']
        kinds: [1],
      ]
    },
    options: { // [!code focus]
      closeOnEose: true // [!code focus]
    }, // [!code focus]
    enabled: true,
    config
  });
}
```

### enabled

`Boolean | undefined`

- Set this to false to disable this query from automatically running.
- The default parameter is true.

```tsx [index.tsx]
import { useSubscription } from '@lawallet/react';

function App() {
  const { subscription, events } = useSubscription({
    filters: {
      [
        authors: ['9a9787e...e28d59']
        kinds: [1],
      ]
    },
    options: {
      closeOnEose: true
    },
    enabled: true // [!code focus]
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
  const { transactions } =useSubscription({
    filters: {
      [
        authors: ['9a9787e...e28d59']
        kinds: [1],
      ]
    },
    enabled: true,
    config // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type useSubscriptionReturns } from '@lawallet/react';
```

### subscription

[`NDKSubscription`](/react/api/glossary/ndk#ndksubscription)

Returns an instance of the subscription

### events

[`NDKEvent[]`](/react/api/glossary/ndk#ndkevent)

Returns an array of events received in the started subscription
