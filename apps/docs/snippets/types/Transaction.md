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
