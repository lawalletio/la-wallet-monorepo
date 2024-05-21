export type CurrencyMetadata = {
  locale: string;
};

export type AvailableCurrencies = 'BTC' | 'MSAT' | 'SAT' | 'USD' | 'ARS';

export type UserConfigProps = {
  hideBalance: boolean;
  currency: AvailableCurrencies;
};
