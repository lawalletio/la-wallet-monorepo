# Types

Glossary of Types in LaWallet

## `CardDataPayload`

Type that defines the information of a card

::: code-group

```ts [CardDataPayload]
type CardDataPayload = { [uuid: string]: { design: Design } };
```

```ts [Design]
type Design = { uuid: string; name: string; description: string };
```

:::

## `CardConfigPayload`

Type that defines the configuration of a card

::: code-group

```ts [CardConfigPayload]
type CardConfigPayload = {
  'trusted-merchants': { pubkey: string }[];
  cards: { [uuid: string]: CardPayload };
};
```

```ts [CardPayload]
type CardPayload = {
  name: string;
  description: string;
  status: string;
  limits: Limit[];
};
```

```ts [Limit]
type Limit = {
  name: string;
  description: string;
  token: string;
  amount: bigint;
  delta: number;
};
```

:::

## `CardsInfo`

Type that defines the information and configuration of the cards

```ts [Config]
type CardsInfo = {
  data: CardDataPayload;
  config: CardConfigPayload;
};
```

## `TokenBalance`

Type to define the balance of a token

```ts [TokenBalance]
interface TokenBalance {
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
interface Transaction {
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
enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
}
```

```ts [Direction]
enum TransactionDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
}
```

```ts [Types]
enum TransactionType {
  CARD = 'CARD',
  INTERNAL = 'INTERNAL',
  LN = 'LN',
}
```

```ts [TokensAmount]
type TokensAmount = {
  [_tokenId: string]: number;
};
```

:::
