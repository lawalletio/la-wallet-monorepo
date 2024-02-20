'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet } from 'styled-components';
import { Provider } from '@lawallet/ui';
import GlobalStyles from '@/styles/GlobalStyles';

export default function StyledComponentsRegistry({ children }) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <React.Fragment>{styles}</React.Fragment>;
  });

  if (typeof window !== 'undefined') return <React.Fragment>{children}</React.Fragment>;

  return (
    <Provider sheet={styledComponentsStyleSheet.instance}>
      <GlobalStyles />
      {children}
    </Provider>
  );
}
