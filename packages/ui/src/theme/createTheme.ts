import { baseTheme } from './theme';
import { ThemeProps, CreateThemeParameters } from './types';

export function createTheme(parameters: CreateThemeParameters = {}): ThemeProps {
  const { colors = {}, borders = {} } = parameters;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...colors,
    },
    borders: {
      ...baseTheme.borders,
      ...borders,
    },
  };
}
