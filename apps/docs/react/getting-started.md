# Getting Started

LaWallet hooks

## Manual Installation

To manually add Wagmi to your project, install the required packages.

::: code-group

```bash-vue [pnpm]
pnpm add @lawallet/react
```

```bash-vue [npm]
npm install @lawallet/react
```

```bash-vue [yarn]
yarn add @lawallet/react
```

```bash-vue [bun]
bun add @lawallet/react
```

:::

- [@lawallet/react](https://lawallet.ar) is a TypeScript interface for LaWallet.

### Create Config

Create and export a new LaWallet config using `createConfig`.

::: code-group
<<< @/snippets/react/config.ts[config.ts]
:::

### Wrap App in Context Provider

Wrap your app in the `LaWalletConfig` React Context Provider and pass the `config` you created earlier to the `value` property.

::: code-group

<<< @/snippets/react/app.tsx[app.tsx]

<<< @/snippets/react/config.ts[config.ts]
:::

Check out the [`LaWalletConfig` docs](/react/api/LaWalletConfig) to learn more about React Context in LaWallet.

### Use LaWallet Hooks

Now that everything is set up

::: code-group

```tsx [UserBalance.tsx]
import { useTokenBalance } from '@lawallet/react';

function App() {
  const userPubkey: string = '9a9787e3e31cfdc95f35d5cfc1eeaead33e693ec59789c20f63546b191e28d59';

  const { balance } = useTokenBalance({
    pubkey: userPubkey,
    tokenId: 'BTC',
    enabled: Boolean(userPubkey.length),
  });

  return <div>Balance BTC: {balance}</div>;
}
```

<<< @/snippets/react/app.tsx[app.tsx]

<<< @/snippets/react/config.ts[config.ts]
:::
