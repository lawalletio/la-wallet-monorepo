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
