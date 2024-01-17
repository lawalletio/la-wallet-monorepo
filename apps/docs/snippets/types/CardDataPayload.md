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
