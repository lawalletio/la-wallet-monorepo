import { execSync } from 'child_process';

export interface PluginData {
  route: string;
  package: string;
}

export function normalizePluginName(input: string): string {
  return input.replace(/[^a-zA-Z]/g, '');
}

export function execCommand(command: string) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error al ejecutar el comando:', error);
    process.exit(1);
  }
}

export function buildPlugins() {
  execCommand('pnpm build:plugins');
  console.log('Configuración de plugins generada correctamente');
}

export function installDependencies() {
  execCommand('pnpm install');
  console.log('Dependencias instaladas correctamente');
}
