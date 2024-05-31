import * as fs from 'fs';
import * as path from 'path';
import type { PluginData } from '../helpers/utils.js';

export async function generateNextConfig(projectPath: string) {
  console.log('\x1b[33m%s\x1b[0m', '╭───────────────────────────────────────────────────────────────────────╮');
  console.log('\x1b[33m%s\x1b[0m', '│                         CONFIG PLUGINS                                │');
  console.log('\x1b[33m%s\x1b[0m', '╰───────────────────────────────────────────────────────────────────────╯');

  console.log('\x1b[33m%s\x1b[0m', 'Generating plugin configuration...');

  const pluginsConfigPath = path.join(projectPath, './src/config/pluginsConfig.json');
  const pluginsConfig = JSON.parse(fs.readFileSync(pluginsConfigPath, 'utf-8'));
  if (!pluginsConfig.pluginsList) pluginsConfig.pluginsList = [];

  const pluginsDir = path.join(projectPath, './src/config/exports/extensions');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

  pluginsConfig.pluginsList.forEach((plugin: PluginData) => {
    const { route, package: pluginPackage } = plugin;
    const metadataImportPath = `${pluginPackage}/metadata`;
    const pluginPath = path.join(pluginsDir, route);

    const metadataContent = `import metadata from '${metadataImportPath}';\nexport default metadata;`;

    const routesContent = `import SpinnerView from '@/components/Spinner/SpinnerView';
    import { PluginRoutes } from '${pluginPackage}';
    import dynamic from 'next/dynamic';
  
    export default PluginRoutes.map((route) => ({
      path: route,
      getComponent: () => dynamic(() => import('${pluginPackage}').then((mod) => mod.App[route]), {
        ssr: false,
        loading: () => <SpinnerView />,
      }),
    }));
  `;

    if (!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath, { recursive: true });

    const metadataDirDest = path.join(pluginPath, `metadata.ts`);
    const routeDirDest = path.join(pluginPath, `routes.tsx`);

    fs.writeFileSync(metadataDirDest, metadataContent);
    fs.writeFileSync(routeDirDest, routesContent);

    console.log('\x1b[32m', `Added ${route} plugin`);
  });

  console.log('\x1b[33m%s\x1b[0m', 'Plugin configuration generated successfully.');
}
