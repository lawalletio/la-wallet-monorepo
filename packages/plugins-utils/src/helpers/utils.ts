import { execSync } from 'child_process';
import inquirer from 'inquirer';

export function execCommand(command: string) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error al ejecutar el comando:', error);
    process.exit(1);
  }
}

export async function askToUser(message: string) {
  const answers = await inquirer.prompt([
    {
      name: 'name',
      type: 'input',
      message,
    },
  ]);

  return answers.name;
}

export function buildPlugins() {
  execCommand('pnpm build:plugins');
  console.log('Configuración de plugins generada correctamente');
}

export function installDependencies() {
  execCommand('pnpm install');
  console.log('Dependencias instaladas correctamente');
}
