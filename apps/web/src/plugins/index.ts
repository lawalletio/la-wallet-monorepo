import { PluginProps } from '@/types/plugins';
import { boltzPlugin } from './boltz';
import { posPlugin } from './pos';

export const PLUGINS: Record<string, PluginProps> = {
  boltz: boltzPlugin,
  pos: posPlugin,
};
