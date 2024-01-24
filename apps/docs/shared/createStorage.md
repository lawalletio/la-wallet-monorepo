# createStorage

Creates new [`Storage`](#storage) object.

## Import

```ts-vue
import { createStorage } from '@lawallet/react'
```

## Usage

```ts-vue
import { createStorage } from '@lawallet/react'

const storage = createStorage({ storage: localStorage })
```

## Parameters

```ts-vue
import { type CreateStorageParameters } from '@lawallet/react'
```

### storage

`{ getItem(key: string): string | null | undefined | Promise<string | null | undefined>; setItem(key: string, value: string): void | Promise<void>; removeItem(key: string): void | Promise<void>; }`

- Storage interface to use for persisting data.
- Defaults to `localStorage`.
- Supports synchronous and asynchronous storage methods.

```ts
import { createStorage } from '@lawallet/react';
// Using IndexedDB via https://github.com/jakearchibald/idb-keyval // [!code focus]
import { del, get, set } from 'idb-keyval'; // [!code focus]

const storage = createStorage({
  storage: {
    // [!code focus]
    async getItem(name) {
      // [!code focus]
      return get(name); // [!code focus]
    }, // [!code focus]
    async setItem(name, value) {
      // [!code focus]
      await set(name, value); // [!code focus]
    }, // [!code focus]
    async removeItem(name) {
      // [!code focus]
      await del(name); // [!code focus]
    }, // [!code focus]
  }, // [!code focus]
});
```

## Return Type

```ts-vue
import { type Storage } from '@lawallet/react'
```

## Storage

Object responsible for persisting LaWallet `Identity` and other data.

```ts-vue
import { type Storage } from '@lawallet/react'
```

### getItem

`getItem(key: string, defaultValue?: value | null | undefined): value | null | Promise<value | null>`

```ts-vue
import { createStorage } from '@lawallet/react'

const storage = createStorage({ storage: localStorage })
const testKey = storage.getItem('testKey') // [!code focus]
```

### setItem

`setItem(key: string, value: any): void | Promise<void>`

```ts-vue
import { createStorage } from '@lawallet/react'

const storage = createStorage({ storage: localStorage })
storage.setItem('testKey', 'foo') // [!code focus]
```

### removeItem

`removeItem(key: string): void | Promise<void>`

```ts-vue
import { createStorage } from '@lawallet/react'

const storage = createStorage({ storage: localStorage })
storage.removeItem('testKey') // [!code focus]
```
