import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';
import { addPlugin } from './addPlugin.js';
import { askToUser, installDependencies } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cloneRepository(targetDir, repoUrl) {
  const git = simpleGit();

  try {
    console.log('\x1b[33m%s\x1b[0m', 'Clonando repositorio template de plugin...');
    if (fs.existsSync(targetDir)) {
      console.error('Error: la carpeta de destino ya existe.');
      process.exit(0);
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

  addPlugin(packageName, projectPath);
}

main().catch((error) => console.error(error));
