## Manual Installation

To manually add @lawallet/react to your project, install the required packages.

```bash-vue [pnpm]
pnpm add @lawallet/react
```

### Create Config

The following configuration contains the default values. If you want to use these values, you should not send any config to the provider.

```tsx [config.ts]
import { type ConfigProps } from '@lawallet/react/types';

export const config: ConfigProps = {
  gatewayEndpoint: 'https://api.lawallet.ar',
  relaysList: ['wss://relay.damus.io', 'wss://relay.lawallet.ar'],
  federation: {
    id: 'lawallet.ar',
    domain: 'lawallet.ar',
    identityEndpoint: 'https://lawallet.ar',
  },
  modulePubkeys: {
    card: '18f6a706091b421bd9db1ec964b4f934007fb6997c60e3c500fdaebe5f9f7b18',
    ledger: 'bd9b0b60d5cd2a9df282fc504e88334995e6fac8b148fa89e0f8c09e2a570a84',
    urlx: 'e17feb5f2cf83546bcf7fd9c8237b05275be958bd521543c2285ffc6c2d654b3',
  },
};
```

### Wrap App in Context Provider

Wrap your app in the `LaWalletProvider` React Context Provider and pass the `config` you created earlier to the `value` property.

```tsx [app.tsx]
import { LaWalletProvider } from '@lawallet/react';
import { config } from './config';

function App() {
  return <LaWalletProvider config={config}>{/** ... **/}</LaWalletProvider>;
}
```
