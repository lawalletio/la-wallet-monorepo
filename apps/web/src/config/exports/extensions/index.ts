import { PluginProps } from './plugins.d';
import { posPlugin } from './pos';

export const PLUGINS: Record<string, PluginProps> = {
  pos: posPlugin,
};
