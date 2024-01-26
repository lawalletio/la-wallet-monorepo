## `CreateIdentityReturns`

Type that defines the return from using createIdentity()

::: code-group

```ts [CreateIdentityReturns]
type CreateIdentityReturns = {
  success: boolean;
  message: string;
  newIdentity?: UserIdentity;
};
```

```ts [UserIdentity]
interface UserIdentity {
  username: string;
  hexpub: string;
  npub: string;
  privateKey: string;
}
```

:::
