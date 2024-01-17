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
