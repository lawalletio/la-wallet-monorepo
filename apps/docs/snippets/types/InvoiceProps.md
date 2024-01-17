## `InvoiceProps`

Type that defines the information of a new invoice to be paid

```ts [InvoiceProps]
type InvoiceProps = {
  bolt11: string;
  created_at: number;
  loading: boolean;
  payed: boolean;
};
```
