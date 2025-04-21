import 'styled-components';
import type { ThemeProps } from './types';

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeProps {}
}