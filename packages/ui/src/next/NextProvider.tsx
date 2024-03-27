import { useServerInsertedHTML } from 'next/navigation';
import React, { ReactNode, useState } from 'react';
import { ServerStyleSheet } from 'styled-components';
import { ReactProvider } from '../react/ReactProvider';
import { ThemeProps, baseTheme } from '../theme';

export function NextProvider({ children, theme = baseTheme }: { children: ReactNode; theme?: ThemeProps }) {
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
    <ReactProvider theme={theme} sheet={sheet}>
      {children}
    </ReactProvider>
  );
}
