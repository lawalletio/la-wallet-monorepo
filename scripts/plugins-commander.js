import path from 'path';
import { createPlugin, addPlugin } from '@lawallet/plugins-utils';

const rootDir = process.cwd();
const args = process.argv.slice(2);
const instruction = args[0];

switch (instruction) {
  case 'create': {
    const pluginsPath = path.resolve(rootDir, './plugins');
    createPlugin(pluginsPath);
    break;
  }

  case 'add':
    const webPath = path.resolve(rootDir, './apps/web');
    addPlugin(webPath);
    break;

  default:
    throw new Error('need argument: create | add');
}
