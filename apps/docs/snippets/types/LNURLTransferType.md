## `LNURLTransferType`

Type that defines the payment information of a LNURL. See [`TransferInformation`](/react/api/glossary/types#transferInformation) & [`LNRequestResponse`](/react/api/glossary/types#lnrequestresponse)

```ts [LNURLTransferType]
interface LNURLTransferType extends TransferInformation {
  comment: string;
  receiverPubkey: string;
  request: LNRequestResponse | null;
}
```
