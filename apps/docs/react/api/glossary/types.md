# Types

Glossary of Types in LaWallet

## `Config`

Type to define the context configuration

```ts [Config]
export type Config = {
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

## `TokenBalance`

Type to define the balance of a token

```ts [TokenBalance]
export interface TokenBalance {
  tokenId: string;
  amount: number;
  loading: boolean;
  lastEvent?: NostrEvent;
  createdAt?: Date;
}
```

## `Transaction`

Type to define a transaction

::: code-group

```ts [Transaction]
export interface Transaction {
  id: string;
  status: TransactionStatus;
  direction: TransactionDirection;
  type: TransactionType;
  tokens: TokensAmount;
  memo: string;
  errors: string[];
  events: NostrEvent[];
  createdAt: number;
}
```

```ts [Status]
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
}
```

```ts [Direction]
export enum TransactionDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}
```

```ts [Types]
export enum TransactionType {
  CARD = 'CARD',
  INTERNAL = 'INTERNAL',
  LN = 'LN',
}
```

```ts [TokensAmount]
export type TokensAmount = {
  [_tokenId: string]: number;
};
```

:::
