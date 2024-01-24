---
title: useLNURL
description: Hook to decode or pay an invoice
---

# useLNURL

Hook to decode or pay an invoice

## Import

```ts
import { useLNURL } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useLNURL } from '@lawallet/react';
import { config } from './config';

function App() {
  const { LNURLInfo, execute } = useLNURL({
    lnurlOrAddress: 'usuario@lawallet.ar',
    amount: 10,
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseLNURLParameters } from '@lawallet/react';
```

### lnurlOrAddress

`String`

- LNURL, LNURLW or lightning network address

```tsx [index.tsx]
import { useLNURL } from '@lawallet/react';

function App() {
  const { LNURLInfo, execute } = useLNURL({
    lnurlOrAddress: 'usuario@lawallet.ar', // [!code focus]
    amount: 10,
  });
}
```

### amount

`Number | undefined`

- Transfer amount or withdraw claim amount
- The amount is set in satoshis

```tsx [index.tsx]
import { useLNURL } from '@lawallet/react';

function App() {
  const { LNURLInfo, execute } = useLNURL({
    lnurlOrAddress: 'usuario@lawallet.ar',
    amount: 10, // [!code focus]
  });
}
```

### comment

`String | undefined`

- Transfer comment

```tsx [index.tsx]
import { useLNURL } from '@lawallet/react';

function App() {
  const { LNURLInfo, execute } = useLNURL({
    lnurlOrAddress: 'usuario@lawallet.ar',
    amount: 10,
    comment: 'hello', // [!code focus]
  });
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useLNURL } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { decodedInvoice, execute } = useLNURL({
    lnurlOrAddress: 'usuario@lawallet.ar',
    amount: 10,
    config, // [!code focus]
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

### onSuccess

`undefined | () => void`

- Function to execute when the invoice payment is successful.

### onError

`undefined | (message?: string) => void`

- Function to execute when the invoice payment has an error.

## Return Type

```ts
import { type UseLNURLReturns } from '@lawallet/react';
```

### isLoading

`Boolean`

This variable defines whether the invoice payment is in the loading stage

### isSuccess

`Boolean`

This variable defines whether the invoice payment was successful

### isError

`Boolean`

This variable defines whether the invoice payment had an error

### error

`string | undefined`

This variable defines the error that occurred in the payment

### LNURLInfo

[`LNURLTransferType`](/react/api/glossary/types#lnurltransfertype)

Information of the transaction to be executed

### execute

`() => Promise<boolean>`

Execute payment or withdrawal
