import { createConfig } from '@lawallet/react/actions';

const isDev = process.env.NODE_ENV === 'development';

export const STORAGE_IDENTITY_KEY = 'identity';
export const CACHE_TXS_KEY = 'cache_txs';
export const CACHE_BACKUP_KEY = 'backup';
export const LAWALLET_VERSION = 'v1.0.1';

export const MAX_INVOICE_AMOUNT = 10 ** 7;

export const config = createConfig({
  endpoints: { identity: isDev ? 'https://debug.lawallet.ar' : 'https://lawallet.ar' },
  federation: { domain: isDev ? 'debug.lawallet.ar' : 'lawallet.ar' },
});

export const regexUserName: RegExp = /^[A-Za-z0123456789]+$/;
export const regexComment: RegExp = /^[.,()[\]_\-a-zA-Z0-9'"¡!¿?:;\s]+$/;
export const regexURL = /^(http|https):\/\/[^ "]+$/;
