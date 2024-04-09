import { dateFormatter, defaultLocale, distanceFormatter, formatToPreference } from '@lawallet/utils';
import type { AvailableCurrencies, AvailableLanguages } from '@lawallet/utils/types';

export interface UseFormatterReturns {
  formatAmount: (amount: number, customCurrency?: AvailableCurrencies) => string;
  formatDate: (date: Date | number, strFormat?: string) => string;
  formatDistance: (date: Date, baseDate: Date) => string;
  customFormat: (props: CustomFormatProps) => string;
}

type UseFormatterProps = {
  currency?: AvailableCurrencies;
  locale?: AvailableLanguages;
};

type CustomFormatProps = {
  amount: number;
  currency?: AvailableCurrencies;
  locale?: AvailableLanguages;
  minDecimals?: number;
  maxDecimals?: number;
};

export const useFormatter = ({ currency = 'SAT', locale = defaultLocale }: UseFormatterProps): UseFormatterReturns => {
  const formatAmount = (amount: number, customCurrency?: AvailableCurrencies) =>
    formatToPreference(customCurrency ?? currency, amount, locale);

  const formatDate = (date: Date | number, strFormat?: string) => dateFormatter(locale, date, strFormat);
  const formatDistance = (date: Date, baseDate: Date) => distanceFormatter(date, baseDate, locale);

  const customFormat = (props: CustomFormatProps) =>
    formatToPreference(
      props.currency ?? currency,
      props.amount,
      props.locale ?? locale,
      props.minDecimals,
      props.maxDecimals,
    );

  return { formatAmount, formatDate, formatDistance, customFormat };
};
