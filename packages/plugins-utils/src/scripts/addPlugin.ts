import * as fs from 'fs';
import * as path from 'path';
import { requestPrompt } from '../helpers/prompt.js';
import { buildPlugins, installDependencies } from '../helpers/utils.js';
import { validateNpmName } from '../helpers/validate-pkg.js';
import { Command } from 'commander';

const program = new Command('create-plugin').option('--name <string>', 'Name of plugin').parse(process.argv);

async function addPluginToPackageJson(packageName: string, projectPath: string) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.dependencies) packageJson.dependencies = {};
  if (!packageJson.pluginsList) packageJson.pluginsList = [];

  const isWorkspaceProject: boolean = process.argv.includes('--w')
    ? true
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

  packageJson.dependencies[packageName] = isWorkspaceProject ? 'workspace:*' : 'latest';
  packageJson.pluginsList.push({
    route: packageName,
    package: packageName,
  });

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\x1b[32m', `Plugin ${packageName} added on ${packageJsonPath}`);
}

export async function addPlugin(projectPath: string) {
  const opts = program.opts();
  const name = opts.name;
  const nameFromParam = typeof opts.name === 'string' && validateNpmName(path.basename(path.resolve(name)));

  const packageName: string = nameFromParam
    ? name
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

  await addPluginToPackageJson(packageName, projectPath);
  buildPlugins();
  installDependencies();
}
