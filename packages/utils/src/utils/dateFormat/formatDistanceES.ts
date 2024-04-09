import type { FormatDistanceFn, FormatDistanceFnOptions, FormatDistanceLocale, FormatDistanceToken } from 'date-fns';

type FormatDistanceTokenValue =
  | string
  | {
      one: string;
      other: string;
    };

const formatDistanceLocale: FormatDistanceLocale<FormatDistanceTokenValue> = {
  lessThanXSeconds: {
    one: 'menos de un segundo',
    other: 'menos de {{count}} segundos',
  },

  xSeconds: {
    one: '1 segundo',
    other: '{{count}} segundos',
  },

  halfAMinute: 'medio minuto',

  lessThanXMinutes: {
    one: 'menos de un minuto',
    other: 'menos de {{count}} minutos',
  },

  xMinutes: {
    one: 'hace 1 minuto',
    other: 'hace {{count}} minutos',
  },

  aboutXHours: {
    one: 'hace 1 hora',
    other: 'hace {{count}} horas',
  },

  xHours: {
    one: 'hace 1 hora',
    other: '{{count}} horas',
  },

  xDays: {
    one: 'hace 1 día',
    other: 'hace {{count}} días',
  },

  aboutXWeeks: {
    one: 'hace de 1 semana',
    other: 'hace {{count}} semanas',
  },

  xWeeks: {
    one: 'hace 1 semana',
    other: 'hace {{count}} semanas',
  },

  aboutXMonths: {
    one: 'hace 1 mes',
    other: 'hace {{count}} meses',
  },

  xMonths: {
    one: 'hace 1 mes',
    other: 'hace {{count}} meses',
  },

  aboutXYears: {
    one: 'hace 1 año',
    other: 'hace {{count}} años',
  },

  xYears: {
    one: 'hace 1 año',
    other: 'hace {{count}} años',
  },

  overXYears: {
    one: 'más de 1 año',
    other: 'más de {{count}} años',
  },

  almostXYears: {
    one: 'casi 1 año',
    other: 'casi {{count}} años',
  },
};

export const formatDistanceES: FormatDistanceFn = (
  token: FormatDistanceToken,
  count: number,
  options?: FormatDistanceFnOptions,
): string => {
  let result;

  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === 'string') {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace('{{count}}', count.toString());
  }

  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return 'en ' + result;
    } else {
      return 'hace ' + result;
    }
  }

  return result;
};
