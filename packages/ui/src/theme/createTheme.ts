import { baseTheme } from './theme.js';
import { ThemeProps, CreateThemeParameters } from './types.js';

export function createTheme(parameters: CreateThemeParameters = {}): ThemeProps {
  const { colors = {}, borders = {}, font = {} } = parameters;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...colors,
      primary15: colors.primary ? `${colors.primary}26` : baseTheme.colors.primary15,
      secondary15: colors.secondary ? `${colors.secondary}26` : baseTheme.colors.secondary15,
      success15: colors.success ? `${colors.success}15` : baseTheme.colors.success15,
      warning15: colors.warning ? `${colors.warning}15` : baseTheme.colors.warning15,
      error15: colors.error ? `${colors.error}15` : baseTheme.colors.error15,
    },
    borders: {
      ...baseTheme.borders,
      ...borders,
    },
    font: {
      ...baseTheme.font,
      ...font,
    },
  };
}
