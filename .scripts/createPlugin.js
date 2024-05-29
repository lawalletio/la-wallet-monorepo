import { execSync } from 'child_process';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function askToUser(message) {
  const answers = await inquirer.prompt([
    {
      name: 'packageName',
      type: 'input',
      message,
    },
  ]);

  return answers.packageName;
}

function addDependencyToPackageJson(packageName, projectPath) {
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
  console.log('\x1b[32m', `Dependencia ${packageName} agregada a ${packageJsonPath}`);
}

function buildPluginsAndConfiguration() {
  try {
    execSync('pnpm build:plugins', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error al compilar los plugins:', error);
    process.exit(1);
  }
}

function installDependencies() {
  try {
    execSync('pnpm install', { stdio: 'inherit' });
    console.log('Dependencias instaladas correctamente');
  } catch (error) {
    console.error('Error al instalar las dependencias:', error);
    process.exit(1);
  }
}

async function cloneRepository(targetDir, repoUrl) {
  const git = simpleGit();

  try {
    console.log('\x1b[33m%s\x1b[0m', 'Clonando repositorio template de plugin...');
    if (fs.existsSync(targetDir)) {
      console.error('Error: la carpeta de destino ya existe.');
      process.exit(0);

      // const response = await askToUser('Desea saltearse este paso y continuar? (y/n):');
      // if (response.toLowerCase() !== 'y') {
      //   process.exit(0);
      // } else {
      //   return;
      // }
    }

    await git.clone(repoUrl, targetDir);
    console.log('\x1b[32m', `Repositorio clonado en ${targetDir}`);
  } catch (error) {
    console.error('Error al clonar el repositorio plugin-template: ', error);
    process.exit(1);
  }
}

function renamePluginPackageName(pluginPath, pluginName) {
  const packageJsonPath = path.join(pluginPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = pluginName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

const initializePluginRepository = async (packageName) => {
  const repoUrl = 'https://github.com/lawalletio/plugin-template.git';
  const targetDir = path.join(__dirname, `../plugins/${packageName}`);

  await cloneRepository(targetDir, repoUrl);
  renamePluginPackageName(targetDir, packageName);

  console.log('\x1b[33m%s\x1b[0m', 'Configure la información del plugin');

  const title = await askToUser('Ingresa el título:');
  const description = await askToUser('Ingresa la descripción:');
  const image = await askToUser('Ingresa la imagen:');
  const author = await askToUser('Ingresa el autor:');

  const metadataPath = path.join(targetDir, './src/manifest/metadata.json');
  fs.writeFileSync(
    metadataPath,
    `{
      "title": "${title}",
      "description": "${description}",
      "image": "${image}", 
      "author": "${author}"
  }`,
  );
};

async function main() {
  const packageName = await askToUser('Ingresa el nombre del plugin:');
  const projectPath = './apps/web';

  await initializePluginRepository(packageName);

  installDependencies();
  addDependencyToPackageJson(packageName, projectPath);
  buildPluginsAndConfiguration();
  installDependencies();
}

main().catch((error) => console.error(error));
