import * as fs from 'fs';
import * as path from 'path';
import type { PluginData } from '../helpers/utils.js';

export async function generateNextConfig(projectPath: string) {
  console.log('\x1b[33m%s\x1b[0m', '╭───────────────────────────────────────────────────────────────────────╮');
  console.log('\x1b[33m%s\x1b[0m', '│                         CONFIG PLUGINS                                │');
  console.log('\x1b[33m%s\x1b[0m', '╰───────────────────────────────────────────────────────────────────────╯');

  console.log('\x1b[33m%s\x1b[0m', 'Generating plugin configuration...');

  const packageJsonPath = path.join(projectPath, './package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (!packageJson.pluginsList) packageJson.pluginsList = [];

  const pluginsDir = path.join(projectPath, './src/config/exports/extensions');
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir);
  }

  packageJson.pluginsList.forEach((plugin: PluginData) => {
    const { route, package: pluginPackage } = plugin;
    const metadataPath = `${pluginPackage}/metadata`;

    const pluginConfig = `import SpinnerView from '@/components/Spinner/SpinnerView';
    import { PluginRoutes } from '${pluginPackage}';
    import metadata from '${metadataPath}';
    import dynamic from 'next/dynamic';
    import { PluginProps } from './plugins.d';
    
    export const ${route}Plugin: PluginProps = {
      metadata,
      routes: PluginRoutes.map((route: string) => ({
        path: route,
        component: () => dynamic(() => import('${pluginPackage}').then((mod) => mod.App[route]), {
          ssr: false,
          loading: () => <SpinnerView />,
        }),
      })),
    };
    `;

    fs.writeFileSync(path.join(pluginsDir, `${route}.tsx`), pluginConfig);

    console.log('\x1b[32m', `Added ${route} plugin`);
  });

  const emptyContent = `import { PluginProps } from './plugins.d';
    export const PLUGINS: Record<string, PluginProps> = {};
    `;

  const indexContent = packageJson.pluginsList.length
    ? `import { PluginProps } from './plugins.d';
    ${packageJson.pluginsList.map((plugin: PluginData) => `import { ${plugin.route}Plugin } from './${plugin.route}';`).join('\n')}
    
    export const PLUGINS: Record<string, PluginProps> = {
      ${packageJson.pluginsList.map((plugin: PluginData) => `${plugin.route}: ${plugin.route}Plugin,`).join('\n  ')}
    };
    `
    : emptyContent;

  fs.writeFileSync(path.join(pluginsDir, 'index.ts'), indexContent);

  console.log('\x1b[33m%s\x1b[0m', 'Plugin configuration generated successfully.');
}
