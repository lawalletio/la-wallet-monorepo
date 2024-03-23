import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Ruta de la carpeta de la aplicación
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appFolder = path.join(__dirname, '../src/app');

// Función para encontrar todos los archivos page.tsx dentro de un directorio
function findPageFiles(directory) {
  const files = fs.readdirSync(directory);
  return files.filter((file) => fs.statSync(path.join(directory, file)).isFile() && file === 'page.tsx');
}

// Función para generar las rutas basadas en los archivos encontrados
function generateRoutes(directory) {
  const files = findPageFiles(directory);
  const directoryName = path.basename(directory);
  return files.map(() => `/${directoryName}`);
}

// Objeto para almacenar las rutas y los componentes asociados
const routes = {};

// Función para recorrer la carpeta de la aplicación y generar las rutas
function traverseAppFolder(directory) {
  const items = fs.readdirSync(directory);
  items.forEach((item) => {
    const itemPath = path.join(directory, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const pageFiles = findPageFiles(itemPath);
      if (pageFiles.length > 0) {
        const directoryRoutes = generateRoutes(itemPath);
        const componentName = `${item.charAt(0).toUpperCase()}${item.slice(1)}Page`; // Convertir nombre de directorio a PascalCase
        directoryRoutes.forEach((route) => {
          routes[route] = componentName;
        });
      }
      traverseAppFolder(itemPath); // Recursión para subdirectorios
    }
  });
}

// Llamar a la función para generar las rutas
traverseAppFolder(appFolder);

// Generar código basado en las rutas encontradas
const code = `
import { AppIndex } from './app';
${Object.entries(routes)
  .map(([route, component]) => `import { ${component}Layout } from './app/${component.toLowerCase()}/layout';`)
  .join('\n')}

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': AppIndex,
  ${Object.entries(routes)
    .map(([route, component]) => `'${route}': ${component}Layout,`)
    .join('\n  ')}
};

export const PluginRoutes = Object.keys(App);
`;

// Escribir el código en un archivo
fs.writeFileSync('./src/generatedRoutes.ts', code);

console.log('Rutas generadas y guardadas en generatedRoutes.ts');
