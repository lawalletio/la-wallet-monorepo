## `NDKFilter`

Type that defines a nostr NDK Filter

```ts [NDKFilter]
type NDKFilter<K extends number = NDKKind> = {
  ids?: string[];
  kinds?: K[];
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  search?: string;
  [key: `#${string}`]: string[] | undefined;
};
```
