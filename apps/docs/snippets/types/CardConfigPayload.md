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
