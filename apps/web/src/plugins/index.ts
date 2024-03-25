import { PluginProps } from '@/types/plugins';
import { posPlugin } from './pos';

export const PLUGINS: Record<string, PluginProps> = {
  pos: posPlugin,
};
