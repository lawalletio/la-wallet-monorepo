## `NDK`

Type that defines the NDK instance

````ts [NDK]
class NDK extends EventEmitter {
  explicitRelayUrls?: WebSocket['url'][];
  pool: NDKPool;
  outboxPool?: NDKPool;
  private _signer?;
  private _activeUser?;
  cacheAdapter?: NDKCacheAdapter;
  debug: debug$1.Debugger;
  devWriteRelaySet?: NDKRelaySet;
  outboxTracker?: OutboxTracker;
  mutedIds: Map<Hexpubkey | NDKEventId, string>;
  clientName?: string;
  clientNip89?: string;
  /**
   * Default relay-auth policy that will be used when a relay requests authentication,
   * if no other policy is specified for that relay.
   *
   * @example Disconnect from relays that request authentication:
   * ```typescript
   * ndk.relayAuthDefaultPolicy = NDKAuthPolicies.disconnect(ndk.pool);
   * ```
   *
   * @example Sign in to relays that request authentication:
   * ```typescript
   * ndk.relayAuthDefaultPolicy = NDKAuthPolicies.signIn({ndk})
   * ```
   *
   * @example Sign in to relays that request authentication, asking the user for confirmation:
   * ```typescript
   * ndk.relayAuthDefaultPolicy = (relay: NDKRelay) => {
   *     const signIn = NDKAuthPolicies.signIn({ndk});
   *     if (confirm(`Relay ${relay.url} is requesting authentication, do you want to sign in?`)) {
   *        signIn(relay);
   *     }
   * }
   * ```
   */
  relayAuthDefaultPolicy?: NDKAuthPolicy;
  /**
   * Fetch function to use for HTTP requests.
   *
   * @example
   * ```typescript
   * import fetch from "node-fetch";
   *
   * ndk.httpFetch = fetch;
   * ```
   */
  httpFetch: typeof fetch | undefined;
  private autoConnectUserRelays;
  private autoFetchUserMutelist;
  constructor(opts?: NDKConstructorParams);
  /**
   * Adds an explicit relay to the pool.
   * @param url
   * @param relayAuthPolicy Authentication policy to use if different from the default
   * @param connect Whether to connect to the relay automatically
   * @returns
   */
  addExplicitRelay(urlOrRelay: string | NDKRelay, relayAuthPolicy?: NDKAuthPolicy, connect?: boolean): NDKRelay;
  toJSON(): string;
  get activeUser(): NDKUser | undefined;
  /**
   * Sets the active user for this NDK instance, typically this will be
   * called when assigning a signer to the NDK instance.
   *
   * This function will automatically connect to the user's relays if
   * `autoConnectUserRelays` is set to true.
   *
   * It will also fetch the user's mutelist if `autoFetchUserMutelist` is set to true.
   */
  set activeUser(user: NDKUser | undefined);
  get signer(): NDKSigner | undefined;
  set signer(newSigner: NDKSigner | undefined);
  /**
   * Connect to relays with optional timeout.
   * If the timeout is reached, the connection will be continued to be established in the background.
   */
  connect(timeoutMs?: number): Promise<void>;
  /**
   * Get a NDKUser object
   *
   * @param opts
   * @returns
   */
  getUser(opts: GetUserParams): NDKUser;
  /**
   * Get a NDKUser from a NIP05
   * @param nip05 NIP-05 ID
   * @returns
   */
  getUserFromNip05(nip05: string): Promise<NDKUser | undefined>;
  /**
   * Create a new subscription. Subscriptions automatically start, you can make them automatically close when all relays send back an EOSE by setting `opts.closeOnEose` to `true`)
   *
   * @param filters
   * @param opts
   * @param relaySet explicit relay set to use
   * @param autoStart automatically start the subscription
   * @returns NDKSubscription
   */
  subscribe(
    filters: NDKFilter | NDKFilter[],
    opts?: NDKSubscriptionOptions,
    relaySet?: NDKRelaySet,
    autoStart?: boolean,
  ): NDKSubscription;
  /**
   * Publish an event to a relay
   * @param event event to publish
   * @param relaySet explicit relay set to use
   * @param timeoutMs timeout in milliseconds to wait for the event to be published
   * @returns The relays the event was published to
   *
   * @deprecated Use `event.publish()` instead
   */
  publish(event: NDKEvent, relaySet?: NDKRelaySet, timeoutMs?: number): Promise<Set<NDKRelay>>;
  /**
   * Fetch a single event.
   *
   * @param idOrFilter event id in bech32 format or filter
   * @param opts subscription options
   * @param relaySetOrRelay explicit relay set to use
   */
  fetchEvent(
    idOrFilter: string | NDKFilter,
    opts?: NDKSubscriptionOptions,
    relaySetOrRelay?: NDKRelaySet | NDKRelay,
  ): Promise<NDKEvent | null>;
  /**
   * Fetch events
   */
  fetchEvents(
    filters: NDKFilter | NDKFilter[],
    opts?: NDKSubscriptionOptions,
    relaySet?: NDKRelaySet,
  ): Promise<Set<NDKEvent>>;
  /**
   * Ensures that a signer is available to sign an event.
   */
  assertSigner(): void;
  /**
   * Creates a new Nip96 instance for the given domain.
   * @param domain Domain to use for nip96 uploads
   * @example Upload a file to a NIP-96 enabled domain:
   *
   * ```typescript
   * const blob = new Blob(["Hello, world!"], { type: "text/plain" });
   * const nip96 = ndk.getNip96("nostrcheck.me");
   * await nip96.upload(blob);
   * ```
   */
  getNip96(domain: string): Nip96;
}
````
