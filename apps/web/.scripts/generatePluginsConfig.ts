const fs = require('fs');
const path = require('path');

const { pluginsList } = require('../package.json');
const pluginsDir = './src/config/exports/extensions';

console.log('\x1b[33m%s\x1b[0m', '╭───────────────────────────────────────────────────────────────────────╮');
console.log('\x1b[33m%s\x1b[0m', '│                         CONFIG PLUGINS                                │');
console.log('\x1b[33m%s\x1b[0m', '╰───────────────────────────────────────────────────────────────────────╯');

console.log('\x1b[33m%s\x1b[0m', 'Generating plugin configuration...');

if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir);
}

pluginsList.forEach((plugin) => {
  const { route, package: pluginPackage } = plugin;
  const metadataPath = `${pluginPackage}/metadata`;

  const pluginConfig = `import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginRoutes } from '${pluginPackage}';
import { metadata } from '${metadataPath}';
import dynamic from 'next/dynamic';
import { PluginProps } from './plugins.d';

export const ${route}Plugin: PluginProps = {
  metadata,
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('${pluginPackage}').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
`;

  fs.writeFileSync(path.join(pluginsDir, `${route}.tsx`), pluginConfig);

  console.log('\x1b[32m', `Added ${route} plugin`);
});

const indexContent = pluginsList.length
  ? `import { PluginProps } from './plugins.d';
${pluginsList.map((plugin) => `import { ${plugin.route}Plugin } from './${plugin.route}';`).join('\n')}

export const PLUGINS: Record<string, PluginProps> = {
  ${pluginsList.map((plugin) => `${plugin.route}: ${plugin.route}Plugin,`).join('\n  ')}
};
`
  : `export const PLUGINS = {};`;

fs.writeFileSync(path.join(pluginsDir, 'index.ts'), indexContent);

console.log('\x1b[33m%s\x1b[0m', 'Plugin configuration generated successfully.');
