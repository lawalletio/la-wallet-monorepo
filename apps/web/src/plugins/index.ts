import { PluginProps } from '@/types/plugins';
import { boltzPlugin } from './boltz';
import { testPlugin } from './test';

export const PLUGINS: Record<string, PluginProps> = {
  boltz: boltzPlugin,
  plugin: testPlugin,
};
