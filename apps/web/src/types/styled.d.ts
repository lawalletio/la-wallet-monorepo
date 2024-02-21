import { baseTheme } from '@lawallet/ui';
import 'styled-components';

type Theme = typeof baseTheme;

declare module 'styled-components' {
  export interface DefaultTheme extends baseTheme {}
}
