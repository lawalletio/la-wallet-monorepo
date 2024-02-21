import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';

// import DocTemplate from './DocTemplate.mdx';

import { Provider } from '../src/Provider';
import { baseTheme } from '../src/theme';
import { GlobalStyle } from '../src/style';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: themes.dark,
      // page: DocTemplate,
      toc: true,
    },
  },
};

export const decorators = [
  withThemeFromJSXProvider({
    themes: {
      dark: theme,
    },
    defaultTheme: 'dark',
    Provider,
    GlobalStyles: GlobalStyle,
  }),
];

export default preview;
