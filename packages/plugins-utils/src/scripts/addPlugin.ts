import * as fs from 'fs';
import * as path from 'path';
import { buildPlugins, installDependencies } from '../helpers/utils.js';

function addPluginToPackageJson(packageName: string, projectPath: string) {
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
  console.log('\x1b[32m', `Plugin ${packageName} added on ${packageJsonPath}`);
}

export function addPlugin(packageName: string, projectPath: string) {
  addPluginToPackageJson(packageName, projectPath);
  buildPlugins();
  installDependencies();
}
