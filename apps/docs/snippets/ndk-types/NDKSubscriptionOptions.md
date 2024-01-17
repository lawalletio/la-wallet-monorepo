## `NDKSubscriptionOptions`

Type that defines a nostr NDK subscription options

```ts [NDKSubscriptionOptions]
interface NDKSubscriptionOptions {
  /**
   * Whether to close the subscription when all relays have reached the end of the event stream.
   * @default false
   */
  closeOnEose?: boolean;
  cacheUsage?: NDKSubscriptionCacheUsage;
  /**
   * Groupable subscriptions are created with a slight time
   * delayed to allow similar filters to be grouped together.
   */
  groupable?: boolean;
  /**
   * The delay to use when grouping subscriptions, specified in milliseconds.
   * @default 100
   */
  groupableDelay?: number;
  /**
   * The subscription ID to use for the subscription.
   */
  subId?: string;
  /**
   * Pool to use
   */
  pool?: NDKPool;
  /**
   * Skip signature verification
   * @default false
   */
  skipVerification?: boolean;
}
```
