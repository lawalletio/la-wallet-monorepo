# createConfig

Creates new [`Config`](/react/api/createConfig#config) object.

## Import

```ts-vue
import { createConfig } from '@lawallet/react'
```

## Usage

<<< @/snippets/react/config.ts[config.ts]

## Return Type

```ts-vue
import { type Config } from '@lawallet/react'
```

### `Config`

Type to define the context configuration

```ts [Config]
type Config = {
  endpoints: {
    identity: string;
    api: string;
  };
  federation: {
    id: string;
    domain: string;
  };
  modulePubkeys: {
    card: string;
    ledger: string;
    urlx: string;
  };
  relaysList: string[];
  storage: BaseStorage;
};
```
