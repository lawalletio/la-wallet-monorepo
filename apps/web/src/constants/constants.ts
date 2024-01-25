import { createConfig } from '@lawallet/react';

const isDev = process.env.NODE_ENV === 'development';

export const STORAGE_IDENTITY_KEY = 'identity';
export const CACHE_TXS_KEY = 'cache_txs';
export const CACHE_BACKUP_KEY = 'backup';
export const LAWALLET_VERSION = 'v1.0.1';

export const MAX_INVOICE_AMOUNT = 10 ** 7;

const devConfig = {
  endpoints: { identity: 'https://debug.lawallet.ar' },
  federation: { id: 'debug.lawallet.ar', domain: 'debug.lawallet.ar' },
};

export const config = createConfig(isDev ? devConfig : {});

export const regexUserName: RegExp = /^[A-Za-z0123456789]+$/;
export const regexComment: RegExp = /^[.,()[\]_\-a-zA-Z0-9'"¡!¿?:;\s]+$/;
export const regexURL = /^(http|https):\/\/[^ "]+$/;
