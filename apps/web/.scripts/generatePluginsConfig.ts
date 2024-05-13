const fs = require('fs');
const path = require('path');

const config = require('../lawallet.config');
const pluginsDir = './src/plugins';

console.log('\x1b[33m%s\x1b[0m', '╭───────────────────────────────────────────────────────────────────────╮');
console.log('\x1b[33m%s\x1b[0m', '│                         CONFIG PLUGINS                                │');
console.log('\x1b[33m%s\x1b[0m', '╰───────────────────────────────────────────────────────────────────────╯');

console.log('\x1b[33m%s\x1b[0m', 'Generating plugin configuration...');

if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir);
}

config.plugins.forEach((plugin) => {
  const { name, path: pluginPath } = plugin;
  const metadataPath = `${pluginPath}/metadata`;

  const pluginConfig = `import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginRoutes } from '${pluginPath}';
import { metadata } from '${metadataPath}';
import dynamic from 'next/dynamic';
import { PluginProps } from './plugins.d';

export const ${name}Plugin: PluginProps = {
  metadata,
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('${pluginPath}').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
`;

  fs.writeFileSync(path.join(pluginsDir, `${name}.tsx`), pluginConfig);

  console.log('\x1b[32m', `Added ${name} plugin`);
});

const indexContent = `import { PluginProps } from './plugins.d';
${config.plugins.map((plugin) => `import { ${plugin.name}Plugin } from './${plugin.name}';`).join('\n')}

export const PLUGINS: Record<string, PluginProps> = {
  ${config.plugins.map((plugin) => `${plugin.name}: ${plugin.name}Plugin,`).join('\n  ')}
};
`;

fs.writeFileSync(path.join(pluginsDir, 'index.ts'), indexContent);

console.log('\x1b[33m%s\x1b[0m', 'Plugin configuration generated successfully.');
