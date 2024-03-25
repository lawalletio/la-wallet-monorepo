import { PluginProps } from '@/types/plugins';
import { templatePlugin } from './template';
import { posPlugin } from './pos';

export const PLUGINS: Record<string, PluginProps> = {
  boltz: templatePlugin,
  pos: posPlugin,
};
