import path from 'path';
import { createPlugin } from '@lawallet/plugins-utils';

const rootDir = process.cwd();
const fullPath = path.resolve(rootDir, './plugins');

createPlugin(fullPath);
