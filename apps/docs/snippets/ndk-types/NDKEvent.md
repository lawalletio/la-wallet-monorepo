## `NDKEvent`

Type that defines a nostr NDK Event

````ts [NDKEvent]
declare class NDKEvent extends EventEmitter {
  ndk?: NDK;
  created_at?: number;
  content: string;
  tags: NDKTag[];
  kind?: NDKKind | number;
  id: string;
  sig?: string;
  pubkey: string;
  private _author;
  /**
   * The relay that this event was first received from.
   */
  relay: NDKRelay | undefined;
  constructor(ndk?: NDK, event?: NostrEvent);
  /**
   * Returns the event as is.
   */
  rawEvent(): NostrEvent;
  set author(user: NDKUser);
  /**
   * Returns an NDKUser for the author of the event.
   */
  get author(): NDKUser;
  /**
   * Tag a user with an optional marker.
   * @param user The user to tag.
   * @param marker The marker to use in the tag.
   */
  tag(user: NDKUser, marker?: string): void;
  /**
   * Tag a user with an optional marker.
   * @param event The event to tag.
   * @param marker The marker to use in the tag.
   * @example
   * ```typescript
   * reply.tag(opEvent, "reply");
   * // reply.tags => [["e", <id>, <relay>, "reply"]]
   * ```
   */
  tag(event: NDKEvent, marker?: string): void;
  /**
   * Return a NostrEvent object, trying to fill in missing fields
   * when possible, adding tags when necessary.
   * @param pubkey {string} The pubkey of the user who the event belongs to.
   * @returns {Promise<NostrEvent>} A promise that resolves to a NostrEvent.
   */
  toNostrEvent(pubkey?: string): Promise<NostrEvent>;
  isReplaceable: () => boolean;
  isEphemeral: () => boolean;
  isParamReplaceable: () => boolean;
  /**
   * Encodes a bech32 id.
   *
   * @returns {string} - Encoded naddr, note or nevent.
   */
  encode: () => `nevent1${string}` | `naddr1${string}` | `note1${string}`;
  encrypt: (recipient?: NDKUser | undefined, signer?: NDKSigner | undefined) => Promise<void>;
  decrypt: (sender?: NDKUser | undefined, signer?: NDKSigner | undefined) => Promise<void>;
  /**
   * Get all tags with the given name
   * @param tagName {string} The name of the tag to search for
   * @returns {NDKTag[]} An array of the matching tags
   */
  getMatchingTags(tagName: string): NDKTag[];
  /**
   * Get the first tag with the given name
   * @param tagName Tag name to search for
   * @returns The value of the first tag with the given name, or undefined if no such tag exists
   */
  tagValue(tagName: string): string | undefined;
  /**
   * Gets the NIP-31 "alt" tag of the event.
   */
  get alt(): string | undefined;
  /**
   * Sets the NIP-31 "alt" tag of the event. Use this to set an alt tag so
   * clients that don't handle a particular event kind can display something
   * useful for users.
   */
  set alt(alt: string | undefined);
  /**
   * Remove all tags with the given name (e.g. "d", "a", "p")
   * @param tagName Tag name to search for and remove
   * @returns {void}
   */
  removeTag(tagName: string): void;
  /**
   * Sign the event if a signer is present.
   *
   * It will generate tags.
   * Repleacable events will have their created_at field set to the current time.
   * @param signer {NDKSigner} The NDKSigner to use to sign the event
   * @returns {Promise<string>} A Promise that resolves to the signature of the signed event.
   */
  sign(signer?: NDKSigner): Promise<string>;
  /**
   * Attempt to sign and then publish an NDKEvent to a given relaySet.
   * If no relaySet is provided, the relaySet will be calculated by NDK.
   * @param relaySet {NDKRelaySet} The relaySet to publish the even to.
   * @returns A promise that resolves to the relays the event was published to.
   */
  publish(relaySet?: NDKRelaySet, timeoutMs?: number): Promise<Set<NDKRelay>>;
  /**
   * Generates tags for users, notes, and other events tagged in content.
   * Will also generate random "d" tag for parameterized replaceable events where needed.
   * @returns {ContentTag} The tags and content of the event.
   */
  generateTags(): Promise<ContentTag>;
  muted(): string | null;
  /**
   * Returns the "d" tag of a parameterized replaceable event or throws an error if the event isn't
   * a parameterized replaceable event.
   * @returns {string} the "d" tag of the event.
   */
  replaceableDTag(): string;
  /**
   * Provides a deduplication key for the event.
   *
   * For kinds 0, 3, 10k-20k this will be the event <kind>:<pubkey>
   * For kinds 30k-40k this will be the event <kind>:<pubkey>:<d-tag>
   * For all other kinds this will be the event id
   */
  deduplicationKey(): string;
  /**
   * Returns the id of the event or, if it's a parameterized event, the generated id of the event using "d" tag, pubkey, and kind.
   * @returns {string} The id
   */
  tagId(): string;
  /**
   * Returns the "reference" value ("<kind>:<author-pubkey>:<d-tag>") for this replaceable event.
   * @returns {string} The id
   */
  tagAddress(): string;
  /**
   * Get the tag that can be used to reference this event from another event.
   *
   * Consider using referenceTags() instead (unless you have a good reason to use this)
   *
   * @example
   *     event = new NDKEvent(ndk, { kind: 30000, pubkey: 'pubkey', tags: [ ["d", "d-code"] ] });
   *     event.tagReference(); // ["a", "30000:pubkey:d-code"]
   *
   *     event = new NDKEvent(ndk, { kind: 1, pubkey: 'pubkey', id: "eventid" });
   *     event.tagReference(); // ["e", "eventid"]
   * @returns {NDKTag} The NDKTag object referencing this event
   */
  tagReference(marker?: string): NDKTag;
  /**
   * Get the tags that can be used to reference this event from another event
   * @param marker The marker to use in the tag
   * @example
   *     event = new NDKEvent(ndk, { kind: 30000, pubkey: 'pubkey', tags: [ ["d", "d-code"] ] });
   *     event.referenceTags(); // [["a", "30000:pubkey:d-code"], ["e", "parent-id"]]
   *
   *     event = new NDKEvent(ndk, { kind: 1, pubkey: 'pubkey', id: "eventid" });
   *     event.referenceTags(); // [["e", "parent-id"]]
   * @returns {NDKTag} The NDKTag object referencing this event
   */
  referenceTags(marker?: string, skipAuthorTag?: boolean): NDKTag[];
  /**
   * Provides the filter that will return matching events for this event.
   *
   * @example
   *    event = new NDKEvent(ndk, { kind: 30000, pubkey: 'pubkey', tags: [ ["d", "d-code"] ] });
   *    event.filter(); // { "#a": ["30000:pubkey:d-code"] }
   * @example
   *    event = new NDKEvent(ndk, { kind: 1, pubkey: 'pubkey', id: "eventid" });
   *    event.filter(); // { "#e": ["eventid"] }
   *
   * @returns The filter that will return matching events for this event
   */
  filter(): NDKFilter;
  /**
   * Create a zap request for an existing event
   *
   * @param amount The amount to zap in millisatoshis
   * @param comment A comment to add to the zap request
   * @param extraTags Extra tags to add to the zap request
   * @param recipient The zap recipient (optional for events)
   * @param signer The signer to use (will default to the NDK instance's signer)
   */
  zap(
    amount: number,
    comment?: string,
    extraTags?: NDKTag[],
    recipient?: NDKUser,
    signer?: NDKSigner,
  ): Promise<string | null>;
  /**
   * Generates a deletion event of the current event
   *
   * @param reason The reason for the deletion
   * @returns The deletion event
   */
  delete(reason?: string): Promise<NDKEvent>;
  /**
   * NIP-18 reposting event.
   *
   * @param publish Whether to publish the reposted event automatically
   * @param signer The signer to use for signing the reposted event
   * @returns The reposted event
   *
   * @function
   */
  repost: (publish?: boolean | undefined, signer?: NDKSigner | undefined) => Promise<NDKEvent>;
  /**
   * React to an existing event
   *
   * @param content The content of the reaction
   */
  react(content: string, publish?: boolean): Promise<NDKEvent>;
}
````
