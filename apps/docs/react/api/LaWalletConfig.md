# LaWalletConfig

React Context Provider for LaWallet.

## Import

```ts
import { LaWalletConfig } from '@lawallet/react';
```

## Usage

::: code-group
<<< @/snippets/react/app.tsx[app.tsx]
<<< @/snippets/react/config.ts[config.ts]
:::

## Parameters

```ts
import { type ConfigParameter } from '@lawallet/react';
```

### config

[`Config`](/react/api/createConfig#config) object to inject with context.

- This parameter is optional. If config is not sent, the default parameters will be used.

::: code-group
<<< @/snippets/react/config.ts[config.ts]
:::

## Context

```ts
import { type ConfigContext } from '@lawallet/react';
```
