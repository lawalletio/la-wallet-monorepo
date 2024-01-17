---
title: useZap
description: Hook to send a zap to a LaWallet user
---

# useZap

Hook to send a zap to a LaWallet user

## Import

```ts
import { useZap } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useZap } from '@lawallet/react';
import { config } from './config';

function App() {
  const userPubkey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { invoice, createZapInvoice, resetInvoice } = useZap({
    receiverPubkey: userPubkey,
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type useZapParameters } from '@lawallet/react';
```

### receiverPubkey

`String`

- Public key of the user to whom you want to send a zap

```tsx [index.tsx]
import { useZap } from '@lawallet/react';

function App() {
  const { invoice, createZapInvoice, resetInvoice } = useZap({
    receiverPubkey: '17efe7a5f1...53936f68b', // [!code focus]
  });
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useZap } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { invoice, createZapInvoice, resetInvoice } = useZap({
    receiverPubkey: '17efe7a5f1...53936f68b',
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Return Type

```ts
import { type useZapReturns } from '@lawallet/react';
```

### invoice

[`InvoiceProps`](/react/api/glossary/types#invoiceprops)

Returns the zap invoice information

### createZapInvoice

`(sats: number) => Promise<string | undefined>`

- Function to create the invoice that will invoke the zap receipt when paying it
- Returns the invoice to be paid in bolt11 format
