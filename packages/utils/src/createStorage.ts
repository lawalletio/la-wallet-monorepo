export type Evaluate<type> = { [key in keyof type]: type[key] } & unknown;

export type BaseStorage = {
  getItem(key: string): string | null | undefined | Promise<string | null | undefined>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};

export type CreateStorageParameters = {
  storage?: Evaluate<BaseStorage> | undefined;
};

export function createStorage(parameters: CreateStorageParameters): Evaluate<BaseStorage> {
  const { storage = noopStorage } = parameters;
  return storage;
}

export const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} satisfies BaseStorage;
