export type CurrencyMetadata = {
  locale: string;
};

export type AvailableCurrencies = 'SAT' | 'USD' | 'ARS';

export type UserConfigProps = {
  hideBalance: boolean;
  currency: AvailableCurrencies;
};
