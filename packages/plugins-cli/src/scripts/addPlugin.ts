import * as fs from 'fs';
import * as path from 'path';
import { requestPrompt } from '../helpers/prompt.js';
import { buildPlugins, installDependencies, normalizePluginName, type PluginData } from '../helpers/utils.js';
import { validateNpmName } from '../helpers/validate-pkg.js';

async function addPluginToPackageJson(packageName: string, projectPath: string, isWorkspaceProject: boolean) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const pluginsConfigPath = path.join(projectPath, './src/config/pluginsConfig.json');
  const pluginsConfig = JSON.parse(fs.readFileSync(pluginsConfigPath, 'utf-8'));

  if (!packageJson.dependencies) packageJson.dependencies = {};
  if (!pluginsConfig.pluginsList) pluginsConfig.pluginsList = [];

  const existPlugin = pluginsConfig.pluginsList.find((plugin: PluginData) => {
    return plugin.package === packageName;
  });

  if (!existPlugin) {
    pluginsConfig.pluginsList.push({
      route: normalizePluginName(packageName),
      package: packageName,
    });
  } else {
    console.warn('The plugin already exists in the list.');
    console.warn('Skipped the step of saving to pluginsList inside the package.json.');
  }

  packageJson.dependencies[packageName] = isWorkspaceProject ? 'workspace:*' : 'latest';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\x1b[32m', `Dependence ${packageName} added on ${packageJsonPath}`);

  fs.writeFileSync(pluginsConfigPath, JSON.stringify(pluginsConfig, null, 2));
  console.log('\x1b[32m', `Plugin ${packageName} added on ${pluginsConfigPath}`);
}

export async function addPlugin(projectPath: string, explicitName?: string, workspace?: boolean) {
  const packageName: string = explicitName
    ? explicitName
    : await requestPrompt({
        message: 'What is your plugin named?',
        initial: 'my-plugin',
        customProps: {
          validate: (name: string) => {
            const validation = validateNpmName(path.basename(path.resolve(name)));
            if (validation.valid) {
              return true;
            }
            return 'Invalid project name: ' + validation.problems[0];
          },
        },
      });

  const isWorkspaceProject: boolean = workspace
    ? workspace
    : Boolean(
        await requestPrompt({
          type: 'toggle',
          message: 'Is the package located in the workspace?',
          customProps: {
            active: 'Yes',
            inactive: 'No',
          },
        }),
      );

  await addPluginToPackageJson(packageName, projectPath, isWorkspaceProject);
  buildPlugins();
  installDependencies();
}
