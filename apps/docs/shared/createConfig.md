# createConfig

Creates new [`Config`](/react/api/createConfig#config) object.

## Import

```ts-vue
import { createConfig } from '@lawallet/react'
```

## Usage

<<< @/snippets/react/config.ts[config.ts]

## Parameters

### endpoints

[`EndpointsConfigurationType`](/react/api/createConfig#configprops)

- LaWallet Configurable Endpoints

```tsx [index.tsx]
import { createConfig } from '@lawallet/react';

export const config = createConfig({
  endpoints: {
    // [!code focus]
    api: 'https://api.lawallet.ar', // [!code focus]
    identity: 'https://lawallet.ar', // [!code focus]
  }, // [!code focus]
});
```

### federation

[`FederationConfigType`](/react/api/createConfig#configprops)

- Federation Settings

```tsx [index.tsx]
import { createConfig } from '@lawallet/react';

export const config = createConfig({
  federation: {
    // [!code focus]
    id: 'lawallet.ar', // [!code focus]
    domain: 'lawallet.ar', // [!code focus]
  }, // [!code focus]
});
```

### modulePubkeys

[`ModulePubkeysConfigType`](/react/api/createConfig#configprops)

- Configuring the public keys of each backend module

```tsx [index.tsx]
import { createConfig } from '@lawallet/react';

export const config = createConfig({
  modulePubkeys: {
    // [!code focus]
    card: '18f6a706091b421bd9db1ec964b4f934007fb6997c60e3c500fdaebe5f9f7b18', // [!code focus]
    ledger: 'bd9b0b60d5cd2a9df282fc504e88334995e6fac8b148fa89e0f8c09e2a570a84', // [!code focus]
    urlx: 'e17feb5f2cf83546bcf7fd9c8237b05275be958bd521543c2285ffc6c2d654b3', // [!code focus]
  }, // [!code focus]
});
```

### relaysList

`String[]`

- List of relays you want to connect to

```tsx [index.tsx]
import { createConfig } from '@lawallet/react';

export const config = createConfig({
  relaysList: ['wss://relay.damus.io', 'wss://relay.lawallet.ar'], // [!code focus]
});
```

### storage

`Storage | undefined`

- [`Storage`](/react/api/createStorage#storage) used by the configuration. Persists state between sessions.
- Defaults to `createStorage({ storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : noopStorage })`.

```tsx [index.tsx]
import { createConfig, createStorage } from '@lawallet/react';

export const config = createConfig({
  storage: createStorage({ storage: localStorage }), // [!code focus]
});
```

### signer

[`SignerTypes`](/react/api/glossary/types#signertypes) | `undefined`

- Defines an initialized signer to sign events

```tsx [index.tsx]
import { createConfig, createSignerWithPrivateKey } from '@lawallet/react';

const signer = createSignerWithPrivateKey('5caa3cd87cf1ad069bcf90065f8e3c60e18a4fca7b6070a44ec7223877504c84'); // [!code focus]

export const config = createConfig({
  signer, // [!code focus]
});
```

## Return Type

```ts-vue
import { type ConfigProps } from '@lawallet/react'
```

### `ConfigProps`

Type to define the context configuration

```ts [ConfigProps]
export type EndpointsConfigType = {
  identity: string;
  api: string;
};

export type FederationConfigType = {
  id: string;
  domain: string;
};

export type ModulePubkeysConfigType = {
  card: string;
  ledger: string;
  urlx: string;
};

export type ConfigProps = {
  endpoints: EndpointsConfigType;
  federation: FederationConfigType;
  modulePubkeys: ModulePubkeysConfigType;
  relaysList: string[];
  storage: BaseStorage;
  signer: NDKSigner | undefined;
};
```
