'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet } from 'styled-components';
import { Provider } from '@lawallet/ui';
import GlobalStyles from '@/styles/GlobalStyles';
import { appTheme } from '@/config';

export default function StyledComponentsRegistry({ children }) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <React.Fragment>{styles}</React.Fragment>;
  });

  const sheet = typeof window === 'undefined' ? styledComponentsStyleSheet.instance : undefined;

  return (
    <Provider theme={appTheme} sheet={sheet}>
      <GlobalStyles />
      {children}
    </Provider>
  );
}
