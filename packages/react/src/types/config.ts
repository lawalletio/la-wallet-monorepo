import { ConfigProps } from '@lawallet/utils'

export type ConfigParameter = {
  config?: ConfigProps
}

export type AvailableCurrencies = 'SAT' | 'USD' | 'ARS'
export const CurrenciesList: AvailableCurrencies[] = ['SAT', 'USD', 'ARS']
export const defaultCurrency: AvailableCurrencies = 'ARS'

type CurrencyMetadata = {
  locale: string
}

export const CurrenciesMetadata: Record<AvailableCurrencies, CurrencyMetadata> =
{
  ARS: {
    locale: 'es-AR'
  },
  SAT: {
    locale: 'es-AR'
  },
  USD: {
    locale: 'en-US'
  }
}

export type UserConfigProps = {
  hideBalance: boolean
  currency: AvailableCurrencies
}

export const defaultUserConfig: UserConfigProps = {
  hideBalance: false,
  currency: 'SAT'
}
