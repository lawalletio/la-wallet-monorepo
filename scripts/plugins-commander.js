import path from 'path';
import { createPlugin, addPlugin, generateNextConfig } from '@lawallet/plugins-utils';

const rootDir = process.cwd();
const args = process.argv.slice(2);
const instruction = args[0];

const webPath = path.resolve(rootDir, './apps/web');
const pluginsPath = path.resolve(rootDir, './plugins');

switch (instruction) {
  case 'create':
    createPlugin(pluginsPath);
    break;

  case 'add':
    addPlugin(webPath);
    break;

  case 'webapp-config':
    generateNextConfig(webPath);
    break;

  default:
    throw new Error('need argument: create | add | webapp-config');
}
