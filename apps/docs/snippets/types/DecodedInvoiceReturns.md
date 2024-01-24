## `DecodedInvoiceReturns`

Type that defines the payment information of an invoice. See [`TransferInformation`](/react/api/glossary/types#transferInformation)

::: code-group

```ts [DecodedInvoiceReturns]
type DecodedInvoiceReturns = PaymentRequestObject & { tagsObject: TagsObject };
```

```ts [PaymentRequestObject]
type PaymentRequestObject = {
  paymentRequest?: string;
  complete?: boolean;
  prefix?: string;
  wordsTemp?: string;
  network?: Network;
  satoshis?: number | null;
  millisatoshis?: string | null;
  timestamp?: number;
  timestampString?: string;
  timeExpireDate?: number;
  timeExpireDateString?: string;
  payeeNodeKey?: string;
  signature?: string;
  recoveryFlag?: number;
  tags: TagsType;
};
```

```ts [TagsObject]
type TagsObject = {
  payment_hash?: string;
  payment_secret?: string;
  description?: string;
  payee_node_key?: string;
  purpose_commit_hash?: string;
  expire_time?: number;
  min_final_cltv_expiry?: number;
  fallback_address?: FallbackAddress;
  routing_info?: RoutingInfo;
  feature_bits?: FeatureBits;
  unknownTags?: UnknownTag[];
};
```

```ts [Network]
type Network = {
  [index: string]: any;
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  validWitnessVersions: number[];
};
```

:::
