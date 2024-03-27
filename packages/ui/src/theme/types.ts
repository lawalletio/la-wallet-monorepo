export interface ThemeProps {
  colors: {
    transparent: string;
    black: string;
    white: string;
    primary: string;
    primary15: string;
    secondary: string;
    secondary15: string;
    gray5: string;
    gray10: string;
    gray15: string;
    gray20: string;
    gray25: string;
    gray30: string;
    gray35: string;
    gray40: string;
    gray45: string;
    gray50: string;
    success: string;
    success15: string;
    warning: string;
    warning15: string;
    error: string;
    error15: string;
    background: string;
    text: string;
  };
  borders: {
    buttonRadius: string;
  };
  font: {
    primary: string;
    secondary: string;
  };
}

export interface CreateThemeParameters {
  colors?: {
    black?: string;
    white?: string;
    primary?: string;
    secondary?: string;
    gray5?: string;
    gray10?: string;
    gray15?: string;
    gray20?: string;
    gray25?: string;
    gray30?: string;
    gray35?: string;
    gray40?: string;
    gray45?: string;
    gray50?: string;
    success?: string;
    warning?: string;
    error?: string;
    background?: string;
    text?: string;
  };
  borders?: {
    buttonRadius?: string;
  };
  font?: {
    primary?: string;
    secondary?: string;
  };
}
