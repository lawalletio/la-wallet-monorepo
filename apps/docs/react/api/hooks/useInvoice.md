---
title: useInvoice
description: Hook to decode or pay an invoice
---

# useInvoice

Hook to decode or pay an invoice

## Import

```ts
import { useInvoice } from '@lawallet/react';
```

## Usage

::: code-group

```tsx [index.tsx]
import { useInvoice } from '@lawallet/react';
import { config } from './config';

function App() {

  const { decodedInvoice, executePayment } = useInvoice({
    bolt11: 'lnbc1...'
    config,
  });
}
```

<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type UseInvoiceParameters } from '@lawallet/react';
```

### bolt11

`String`

- Lightning network invoice in bolt11 format

```tsx [index.tsx]
import { useInvoice } from '@lawallet/react';

function App() {
  const { decodedInvoice, executePayment } = useInvoice({
    bolt11: 'lnbc1...', // [!code focus]
  });
}
```

### config

`Config | undefined`

[`Config`](/react/api/createConfig#config) to use instead of retrieving from the from nearest [`LaWalletConfig`](/react/api/LaWalletConfig).

::: code-group

```tsx [index.tsx]
import { useInvoice } from '@lawallet/react';
import { config } from './config'; // [!code focus]

function App() {
  const { decodedInvoice, executePayment } = useInvoice({
    bolt11: 'lnbc1...',
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
import { type UseInvoiceReturns } from '@lawallet/react';
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

### parsedInvoice

[`InvoiceTransferType`](/react/api/glossary/types#invoicetransfertype)

Information of the transaction to be executed

### decodedInvoice

[`DecodedInvoiceReturns`](/react/api/glossary/types#decodedinvoicereturns)

Decoded invoice information

### executePayment

`() => Promise<boolean>`

Execute invoice payment
