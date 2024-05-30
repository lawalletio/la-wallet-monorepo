import * as fs from 'fs';
import * as path from 'path';
import { askToUser, buildPlugins, installDependencies } from './utils.js';

function addPluginToPackageJson(packageName, projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.dependencies) packageJson.dependencies = {};
  if (!packageJson.pluginsList) packageJson.pluginsList = [];

  packageJson.dependencies[packageName] = 'workspace:*';
  packageJson.pluginsList.push({
    route: packageName,
    package: packageName,
  });

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\x1b[32m', `Plugin ${packageName} agregada a ${packageJsonPath}`);
}

export function addPlugin(packageName, projectPath) {
  addPluginToPackageJson(packageName, projectPath);
  buildPlugins();
  installDependencies();
}

async function initAddPlugin() {
  const projectPath = './apps/web';
  const packageName = await askToUser('Ingrese el nombre del paquete npm/workspace: ');

  addPlugin(packageName, projectPath);
}

initAddPlugin();
