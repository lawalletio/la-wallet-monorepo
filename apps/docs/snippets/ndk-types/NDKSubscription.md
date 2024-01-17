## `NDKSubscription`

Type that defines a nostr NDK subscription

```ts [NDKSubscription]
declare class NDKSubscription extends EventEmitter {
  readonly subId?: string;
  readonly filters: NDKFilter[];
  readonly opts: NDKSubscriptionOptions;
  readonly pool: NDKPool;
  readonly skipVerification: boolean;
  /**
   * Tracks the filters as they are executed on each relay
   */
  relayFilters?: Map<WebSocket['url'], NDKFilter[]>;
  relaySet?: NDKRelaySet;
  ndk: NDK;
  debug: debug.Debugger;
  eoseDebug: debug.Debugger;
  /**
   * Events that have been seen by the subscription, with the time they were first seen.
   */
  eventFirstSeen: Map<string, number>;
  /**
   * Relays that have sent an EOSE.
   */
  eosesSeen: Set<NDKRelay>;
  /**
   * Events that have been seen by the subscription per relay.
   */
  eventsPerRelay: Map<NDKRelay, Set<NDKEventId>>;
  /**
   * The time the last event was received by the subscription.
   * This is used to calculate when EOSE should be emitted.
   */
  private lastEventReceivedAt;
  internalId: string;
  constructor(
    ndk: NDK,
    filters: NDKFilter | NDKFilter[],
    opts?: NDKSubscriptionOptions,
    relaySet?: NDKRelaySet,
    subId?: string,
  );
  /**
   * Provides access to the first filter of the subscription for
   * backwards compatibility.
   */
  get filter(): NDKFilter;
  isGroupable(): boolean;
  private shouldQueryCache;
  private shouldQueryRelays;
  private shouldWaitForCache;
  /**
   * Start the subscription. This is the main method that should be called
   * after creating a subscription.
   */
  start(): Promise<void>;
  stop(): void;
  /**
   * @returns Whether the subscription has an authors filter.
   */
  hasAuthorsFilter(): boolean;
  private startWithCache;
  /**
   * Send REQ to relays
   */
  private startWithRelays;
  /**
   * Called when an event is received from a relay or the cache
   * @param event
   * @param relay
   * @param fromCache Whether the event was received from the cache
   */
  eventReceived(event: NDKEvent, relay: NDKRelay | undefined, fromCache?: boolean): void;
  private eoseTimeout;
  eoseReceived(relay: NDKRelay): void;
}
```
