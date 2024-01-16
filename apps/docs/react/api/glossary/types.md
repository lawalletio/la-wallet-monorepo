# Types

Glossary of Types in LaWallet

## `TokenBalance`

Type to define the balance of a token

```ts [TokenBalance.ts]
export interface TokenBalance {
  tokenId: string;
  amount: number;
  loading: boolean;
  lastEvent?: NostrEvent;
  createdAt?: Date;
}
```
