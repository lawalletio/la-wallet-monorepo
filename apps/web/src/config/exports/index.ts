import { del, get, set } from 'idb-keyval';
import { createConfig, createStorage } from '@lawallet/react';
import { ConfigProps } from '@lawallet/react/types';
import { createTheme } from '@lawallet/ui';
import federationConfig from '../federationConfig.json';
import themeConfig from '../themeConfig.json';
import pluginsConfig from '../pluginsConfig.json';

const storage = createStorage({
  storage: {
    async getItem(name) {
      try {
        return get(name);
      } catch {
        return localStorage.getItem(name);
      }
    },
    async setItem(name, value) {
      try {
        await set(name, value);
      } catch {
        localStorage.setItem(name, value);
      }
    },
    async removeItem(name) {
      try {
        await del(name);
      } catch {
        localStorage.removeItem(name);
      }
    },
  },
});

export const config: ConfigProps = createConfig({
  ...federationConfig,
  storage,
});

export const appTheme = createTheme(themeConfig);

export const pluginsEnabled: boolean = Boolean(pluginsConfig.enabled);
