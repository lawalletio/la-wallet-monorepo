import { noopStorage } from '../createStorage.js';
import { type ConfigProps } from '../types/config.js';
import type { UserIdentity } from '../types/identity.js';
import { TransferTypes, type InvoiceTransferType, type LNURLTransferType } from '../types/transaction.js';
import type { AvailableLanguages } from '../types/translations.js';
import type { AvailableCurrencies, CurrencyMetadata, UserConfigProps } from '../types/userConfig.js';

export const baseConfig: ConfigProps = {
  endpoints: {
    api: 'https://api.lawallet.ar',
    identity: 'https://lawallet.ar',
  },
  relaysList: ['wss://relay.damus.io', 'wss://relay.lawallet.ar'],
  federation: {
    id: 'lawallet.ar',
    domain: 'lawallet.ar',
  },
  modulePubkeys: {
    card: '18f6a706091b421bd9db1ec964b4f934007fb6997c60e3c500fdaebe5f9f7b18',
    ledger: 'bd9b0b60d5cd2a9df282fc504e88334995e6fac8b148fa89e0f8c09e2a570a84',
    urlx: 'e17feb5f2cf83546bcf7fd9c8237b05275be958bd521543c2285ffc6c2d654b3',
  },
  storage: noopStorage,
};

export const LanguagesList: AvailableLanguages[] = ['es', 'en'];
export const defaultLocale: AvailableLanguages = 'es';

export const CurrenciesMetadata: Record<AvailableCurrencies, CurrencyMetadata> = {
  ARS: {
    locale: 'es-AR',
  },
  SAT: {
    locale: 'es-AR',
  },
  USD: {
    locale: 'en-US',
  },
};

export const CurrenciesList: AvailableCurrencies[] = ['SAT', 'USD', 'ARS'];
export const defaultCurrency: AvailableCurrencies = 'ARS';

export const defaultUserConfig: UserConfigProps = {
  hideBalance: false,
  currency: 'SAT',
};

export const defaultIdentity: UserIdentity = {
  username: '',
  hexpub: '',
  privateKey: '',
  npub: '',
};

export const defaultInvoiceTransfer: InvoiceTransferType = {
  data: '',
  amount: 0,
  type: TransferTypes.NONE,
  expired: false,
};

export const defaultLNURLTransfer: LNURLTransferType = {
  data: '',
  amount: 0,
  comment: '',
  receiverPubkey: baseConfig.modulePubkeys.urlx,
  type: TransferTypes.NONE,
  request: null,
};
