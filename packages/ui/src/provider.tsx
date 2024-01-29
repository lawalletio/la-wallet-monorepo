import React, { ReactNode } from 'react';
import { ThemeProvider, StyleSheetManager, ExecutionProps } from 'styled-components';

import { theme } from './theme';
import { GlobalStyle } from './style';

interface ProviderProps {
  children: ReactNode;
  sheet: any;
}

export function Provider(props: ProviderProps) {
  const { children, sheet } = props;

  return (
    <StyleSheetManager sheet={sheet}>
      <GlobalStyle />
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyleSheetManager>
  );
}
