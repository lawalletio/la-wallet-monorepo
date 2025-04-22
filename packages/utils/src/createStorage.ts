export enum MappedStoragedKeys {
  Identity = 'identity',
  Config = 'config',
  Prices = 'prices',
  Backup = 'backup',
  TxEvents = 'txs_events',
}

export const STORAGE_EXPECTED_VERSIONS: Record<string, string> = {
  [MappedStoragedKeys.TxEvents]: 'v2',
};

export type Evaluate<type> = { [key in keyof type]: type[key] } & unknown;

export type BaseStorage = {
  getItem(key: string): string | null | undefined | Promise<string | null | undefined>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};

export type CreateStorageParameters = {
  storage?: Evaluate<BaseStorage> | undefined;
};

function resolveVersion(key: string, versions: Record<string, string>): string | undefined {
  if (versions[key]) return versions[key];

  const prefix = Object.keys(versions).find((vk) => key.startsWith(vk));
  return prefix ? versions[prefix] : undefined;
}

export function withVersionedStorage(
  base: Evaluate<BaseStorage>,
  versions: Record<string, string>,
): Evaluate<BaseStorage> {
  return {
    async getItem(key) {
      const versionedKey = `${key}__version`;
      const expectedVersion = resolveVersion(key, versions);

      const [value, storedVersion] = await Promise.all([base.getItem(key), base.getItem(versionedKey)]);

      if (!value) return null;

      if (expectedVersion && storedVersion !== expectedVersion) {
        await base.removeItem(key);
        await base.removeItem(versionedKey);
        return null;
      }

      return value;
    },

    async setItem(key, value) {
      const version = resolveVersion(key, versions);
      const versionedKey = `${key}__version`;

      await Promise.all([base.setItem(key, value), version ? base.setItem(versionedKey, version) : null]);
    },

    async removeItem(key) {
      const versionedKey = `${key}__version`;
      await Promise.all([base.removeItem(key), base.removeItem(versionedKey)]);
    },
  };
}

export const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} satisfies BaseStorage;

export function createStorage(parameters: CreateStorageParameters): Evaluate<BaseStorage> {
  if (!parameters.storage) return noopStorage;

  const { storage } = parameters;

  return withVersionedStorage(storage, STORAGE_EXPECTED_VERSIONS);
}
