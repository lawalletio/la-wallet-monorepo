import React, { ReactNode } from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

import { baseTheme } from '../theme';
import { ThemeProps } from '../theme/types';
import GlobalStyles from '../css';

interface ProviderProps {
  children: ReactNode;
  theme?: ThemeProps;
  sheet?: any;
}

export function ReactProvider(props: ProviderProps) {
  const { children, theme = baseTheme, sheet } = props;

  return (
    <StyleSheetManager sheet={sheet}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        {children}
      </ThemeProvider>
    </StyleSheetManager>
  );
}
