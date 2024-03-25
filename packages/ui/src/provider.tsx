import React, { ReactNode } from 'react';
import { ThemeProvider, StyleSheetManager } from 'styled-components';

import { ThemeProps } from './theme/types';
import { baseTheme } from './theme';

interface ProviderProps {
  children: ReactNode;
  theme?: ThemeProps;
  sheet?: any;
}

export function Provider(props: ProviderProps) {
  const { children, theme = baseTheme, sheet } = props;

  return (
    <StyleSheetManager sheet={sheet}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyleSheetManager>
  );
}
