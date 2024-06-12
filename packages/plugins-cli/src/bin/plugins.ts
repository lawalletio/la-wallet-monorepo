#!/usr/bin/env node
import { Command } from 'commander';
import { createPlugin } from '../scripts/createPlugin.js';
import path from 'path';
import { addPlugin } from '../scripts/addPlugin.js';
import { validateNpmName } from '../helpers/validate-pkg.js';
import { generateNextConfig } from '../scripts/generateConfig.js';
import { buildRoutesMapping } from '../scripts/buildRoutes.js';

const program = new Command().name('lawallet-plugins').description('The LaWallet Plugins CLI.');

program.command('create').action(() => {
  const rootDir = process.cwd();
  const pluginsPath = path.resolve(rootDir, './plugins');

  createPlugin(pluginsPath);
});

program
  .command('add')
  .option('--name <string>', 'Name of plugin')
  .option('--w', 'Define that the plugin will be in the workspace')
  .action((options) => {
    const rootDir = process.cwd();
    const webPath = path.resolve(rootDir, './apps/web');

    const name = options.name;
    const nameFromParam = typeof name === 'string' && validateNpmName(path.basename(path.resolve(name)));
    const isWorkspace = options.w;

    addPlugin(webPath, nameFromParam && nameFromParam.valid ? name : undefined, isWorkspace);
  });

program.command('webapp-config').action(() => {
  const rootDir = process.cwd();
  const webPath = path.resolve(rootDir, './apps/web');

  generateNextConfig(webPath);
});

program.command('build-routes').action(() => {
  const rootDir = process.cwd();
  buildRoutesMapping(rootDir);
});

program.parse(process.argv);
