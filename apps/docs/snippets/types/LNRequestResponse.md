## `LNRequestResponse`

Type that defines the payRequest or withdrawRequest of a lightning network account

```ts [LNRequestResponse]
interface LNRequestResponse {
  tag: string;
  callback: string;
  metadata: string;
  commentAllowed: number;
  minSendable?: number;
  maxSendable?: number;
  k1?: string;
  minWithdrawable?: number;
  maxWithdrawable?: number;
}
```
