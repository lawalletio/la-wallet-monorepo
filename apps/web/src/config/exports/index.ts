import { createConfig } from '@lawallet/react';
import { ConfigProps } from '@lawallet/react/types';
import { createTheme } from '@lawallet/ui';
import federationConfig from '../federationConfig.json';
import themeConfig from '../themeConfig.json';

export const config: ConfigProps = createConfig(federationConfig);
export const appTheme = createTheme(themeConfig);
