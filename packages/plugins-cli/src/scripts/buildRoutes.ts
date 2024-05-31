import fs from 'fs/promises';
import path, { join } from 'path';
import UglifyJS from 'uglify-js';
import { recursiveReadDir } from '../helpers/recursive-readdir.js';

type PageProps = {
  path: string;
  component: string;
};

type PageExtensions = string[];
const APP_DIR_ALIAS = 'private-next-app-dir';

function normalizePathSep(path: string) {
  return path.replace(/\\/g, '/');
}

function getPageFromPath(pagePath: string, pageExtensions: PageExtensions) {
  let page = normalizePathSep(pagePath.replace(new RegExp(`\\.+(${pageExtensions.join('|')})$`), ''));
  page = page.replace(/\/index$/, '');

  return page === '' ? '/' : page;
}

const STATIC_METADATA_IMAGES = {
  icon: {
    filename: 'icon',
    extensions: ['ico', 'jpg', 'jpeg', 'png', 'svg'],
  },
  apple: {
    filename: 'apple-icon',
    extensions: ['jpg', 'jpeg', 'png'],
  },
  favicon: {
    filename: 'favicon',
    extensions: ['ico'],
  },
  openGraph: {
    filename: 'opengraph-image',
    extensions: ['jpg', 'jpeg', 'png', 'gif'],
  },
  twitter: {
    filename: 'twitter-image',
    extensions: ['jpg', 'jpeg', 'png', 'gif'],
  },
};

// Match routes that are metadata routes, e.g. /sitemap.xml, /favicon.<ext>, /<icon>.<ext>, etc.
// TODO-METADATA: support more metadata routes with more extensions
const defaultExtensions = ['js', 'jsx', 'ts', 'tsx'];

const getExtensionRegexString = (extensions: string[]) => `(?:${extensions.join('|')})`;

function isMetadataRouteFile(appDirRelativePath: string, pageExtensions: PageExtensions, withExtension: boolean) {
  const metadataRouteFilesRegex = [
    new RegExp(`^[\\\\/]robots${withExtension ? `\\.${getExtensionRegexString(pageExtensions.concat('txt'))}$` : ''}`),
    new RegExp(
      `^[\\\\/]manifest${
        withExtension ? `\\.${getExtensionRegexString(pageExtensions.concat('webmanifest', 'json'))}$` : ''
      }`,
    ),
    new RegExp(`^[\\\\/]favicon\\.ico$`),
    new RegExp(`[\\\\/]sitemap${withExtension ? `\\.${getExtensionRegexString(pageExtensions.concat('xml'))}$` : ''}`),
    new RegExp(
      `[\\\\/]${STATIC_METADATA_IMAGES.icon.filename}\\d?${
        withExtension
          ? `\\.${getExtensionRegexString(pageExtensions.concat(STATIC_METADATA_IMAGES.icon.extensions))}$`
          : ''
      }`,
    ),
    new RegExp(
      `[\\\\/]${STATIC_METADATA_IMAGES.apple.filename}\\d?${
        withExtension
          ? `\\.${getExtensionRegexString(pageExtensions.concat(STATIC_METADATA_IMAGES.apple.extensions))}$`
          : ''
      }`,
    ),
    new RegExp(
      `[\\\\/]${STATIC_METADATA_IMAGES.openGraph.filename}\\d?${
        withExtension
          ? `\\.${getExtensionRegexString(pageExtensions.concat(STATIC_METADATA_IMAGES.openGraph.extensions))}$`
          : ''
      }`,
    ),
    new RegExp(
      `[\\\\/]${STATIC_METADATA_IMAGES.twitter.filename}\\d?${
        withExtension
          ? `\\.${getExtensionRegexString(pageExtensions.concat(STATIC_METADATA_IMAGES.twitter.extensions))}$`
          : ''
      }`,
    ),
  ];

  const normalizedAppDirRelativePath = normalizePathSep(appDirRelativePath);
  return metadataRouteFilesRegex.some((r) => r.test(normalizedAppDirRelativePath));
}

function isStaticMetadataRouteFile(appDirRelativePath: string) {
  return isMetadataRouteFile(appDirRelativePath, [], true);
}

function isStaticMetadataRoute(page: string) {
  return page === '/robots' || page === '/manifest' || isStaticMetadataRouteFile(page);
}

/*
 * Remove the 'app' prefix or '/route' suffix, only check the route name since they're only allowed in root app directory
 * e.g.
 * /app/robots -> /robots
 * app/robots -> /robots
 * /robots -> /robots
 */
function isMetadataRoute(route: string) {
  let page = route.replace(/^\/?app\//, '').replace(/\/route$/, '');
  if (page[0] !== '/') page = '/' + page;

  return !page.endsWith('/page') && isMetadataRouteFile(page, defaultExtensions, false);
}

// http://www.cse.yorku.ca/~oz/hash.html
// More specifically, 32-bit hash via djbxor
// (ref: https://gist.github.com/eplawless/52813b1d8ad9af510d85?permalink_comment_id=3367765#gistcomment-3367765)
// This is due to number type differences between rust for turbopack to js number types,
// where rust does not have easy way to repreesnt js's 53-bit float number type for the matching
// overflow behavior. This is more `correct` in terms of having canonical hash across different runtime / implementation
// as can gaurantee determinstic output from 32bit hash.
function djb2Hash(str: string) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash + char) & 0xffffffff;
  }
  return hash >>> 0;
}

function getMetadataRouteSuffix(page: string) {
  let suffix = '';

  if ((page.includes('(') && page.includes(')')) || page.includes('@')) {
    suffix = djb2Hash(page).toString(36).slice(0, 6);
  }
  return suffix;
}

function normalizeMetadataRoute(page: string) {
  if (!isMetadataRoute(page)) {
    return page;
  }
  let route = page;
  let suffix = '';
  if (page === '/robots') {
    route += '.txt';
  } else if (page === '/manifest') {
    route += '.webmanifest';
  }
  // For sitemap, we don't automatically add the route suffix since it can have sub-routes
  else if (!page.endsWith('/sitemap')) {
    // Remove the file extension, e.g. /route-path/robots.txt -> /route-path
    const pathnamePrefix = page.slice(0, -(path.basename(page).length + 1));
    suffix = getMetadataRouteSuffix(pathnamePrefix);
  }
  // Support both /<metadata-route.ext> and custom routes /<metadata-route>/route.ts.
  // If it's a metadata file route, we need to append /[id]/route to the page.
  if (!route.endsWith('/route')) {
    const { dir, name: baseName, ext } = path.parse(route);
    const isStaticRoute = isStaticMetadataRoute(page);

    route = path.posix.join(
      dir,
      `${baseName}${suffix ? `-${suffix}` : ''}${ext}`,
      isStaticRoute ? '' : '[[...__metadata_id__]]',
      'route',
    );
  }

  return route;
}

function createPagesMapping({ pageExtensions, pagePaths }: { pageExtensions: PageExtensions; pagePaths: string[] }) {
  const pages = pagePaths.reduce<{ [key: string]: string }>((result, pagePath) => {
    // Do not process .d.ts files as routes
    if (pagePath.endsWith('.d.ts') && pageExtensions.includes('ts')) {
      return result;
    }

    let pageKey = getPageFromPath(pagePath, pageExtensions).replace(/%5F/g, '_');

    const normalizedPath = normalizePathSep(join(APP_DIR_ALIAS));

    const route = normalizeMetadataRoute(pageKey);
    result[route] = normalizedPath;
    return result;
  }, {});

  return pages;
}

function isGroupSegment(segment: string) {
  // Use array[0] for performant purpose
  return segment[0] === '(' && segment.endsWith(')');
}

function ensureLeadingSlash(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeAppPath(route: string) {
  return ensureLeadingSlash(
    route.split('/').reduce((pathname, segment, index, segments) => {
      // Empty segments are ignored.
      if (!segment) {
        return pathname;
      }

      // Groups are ignored.
      if (isGroupSegment(segment)) {
        return pathname;
      }

      // Parallel segments are ignored.
      if (segment[0] === '@') {
        return pathname;
      }

      // The last segment (if it's a leaf) should be ignored.
      if ((segment === 'page' || segment === 'layout' || segment === 'route') && index === segments.length - 1) {
        return pathname;
      }

      return `${pathname}/${segment}`;
    }, ''),
  );
}

const INTERCEPTION_ROUTE_MARKERS = ['(..)(..)', '(.)', '(..)', '(...)'];
const TEST_ROUTE = /\/\[[^/]+?\](?=\/|$)/;

function isInterceptionRouteAppPath(path: string) {
  // TODO-APP: add more serious validation
  return path.split('/').find((segment) => INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m))) !== undefined;
}

function extractInterceptionRouteInformation(path: string) {
  let interceptingRoute, marker, interceptedRoute;

  for (const segment of path.split('/')) {
    marker = INTERCEPTION_ROUTE_MARKERS.find((m) => segment.startsWith(m));
    if (marker) {
      [interceptingRoute, interceptedRoute] = path.split(marker, 2);
      break;
    }
  }

  if (!interceptingRoute || !marker || !interceptedRoute) {
    throw new Error(
      `Invalid interception route: ${path}. Must be in the format /<intercepting route>/(..|...|..)(..)/<intercepted route>`,
    );
  }

  interceptingRoute = normalizeAppPath(interceptingRoute); // normalize the path, e.g. /(blog)/feed -> /feed

  switch (marker) {
    case '(.)':
      // (.) indicates that we should match with sibling routes, so we just need to append the intercepted route to the intercepting route
      if (interceptingRoute === '/') {
        interceptedRoute = `/${interceptedRoute}`;
      } else {
        interceptedRoute = interceptingRoute + '/' + interceptedRoute;
      }
      break;
    case '(..)':
      // (..) indicates that we should match at one level up, so we need to remove the last segment of the intercepting route
      if (interceptingRoute === '/') {
        throw new Error(
          `Invalid interception route: ${path}. Cannot use (..) marker at the root level, use (.) instead.`,
        );
      }
      interceptedRoute = interceptingRoute.split('/').slice(0, -1).concat(interceptedRoute).join('/');
      break;
    case '(...)':
      // (...) will match the route segment in the root directory, so we need to use the root directory to prepend the intercepted route
      interceptedRoute = '/' + interceptedRoute;
      break;
    case '(..)(..)': {
      // (..)(..) indicates that we should match at two levels up, so we need to remove the last two segments of the intercepting route
      const splitInterceptingRoute = interceptingRoute.split('/');
      if (splitInterceptingRoute.length <= 2) {
        throw new Error(
          `Invalid interception route: ${path}. Cannot use (..)(..) marker at the root level or one level up.`,
        );
      }

      interceptedRoute = splitInterceptingRoute.slice(0, -2).concat(interceptedRoute).join('/');
      break;
    }

    default:
      throw new Error('Invariant: unexpected marker');
  }

  return { interceptingRoute, interceptedRoute };
}

function isDynamicRoute(route: string) {
  if (isInterceptionRouteAppPath(route)) {
    route = extractInterceptionRouteInformation(route).interceptedRoute;
  }

  return TEST_ROUTE.test(route);
}

function transformDynamicRoute(route: string) {
  return route.replace(/\[([^\]]+)\]/g, ':$1');
}

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkComponentExport(componentPath: string) {
  try {
    const fileContent = await fs.readFile(componentPath, 'utf8');

    if (!fileContent.includes('export default')) {
      console.warn(`Warning: 'export default' not found in ${componentPath}`);
      throw new Error();
    }
  } catch {
    throw new Error(`Error reading file ${componentPath}`);
  }
}

const appDirectory = 'src/app';

export async function buildRoutesMapping(projectPath: string) {
  const rootPath = path.resolve(projectPath, `./${appDirectory}`);
  recursiveReadDir(rootPath, { ignorePartFilter: (part) => part.startsWith('_') }).then((appPaths) => {
    const mappedAppPages = createPagesMapping({
      pagePaths: appPaths,
      pageExtensions: ['tsx'],
    });

    const routes: PageProps[] = [],
      layouts: PageProps[] = [];

    let importStatements = `import React from 'react';\n`;

    Object.keys(mappedAppPages).forEach((page, index) => {
      const withoutAppDir = page.replace(appDirectory, '');
      const normalizedPath = normalizeAppPath(withoutAppDir);

      checkComponentExport(path.resolve(rootPath, `./${page}.tsx`));
      importStatements += `import p${index} from './app${withoutAppDir}';\n`;

      if (withoutAppDir.endsWith('/layout')) {
        layouts.push({ path: normalizedPath, component: `p${index}` });
        return;
      } else {
        if (routes.some((route) => route.path === normalizedPath))
          throw new Error(`Conflict with route: ${normalizedPath}`);

        routes.push({ path: normalizedPath, component: `p${index}` });
        return;
      }
    });

    let routeMappings = 'export const App = {\n';
    routes.forEach((route) => {
      const layout = layouts.find((layout) => layout.path === route.path);

      const isDynamic = isDynamicRoute(route.path);
      const pathRoute = isDynamic ? transformDynamicRoute(route.path) : route.path;

      if (layout) {
        routeMappings += `  "${pathRoute}": (props) => (\n    React.createElement(\n      ${layout.component},\n      props,\n      React.createElement(${route.component}, props)\n    )\n  ),\n`;
      } else {
        routeMappings += `  "${pathRoute}": (props) => (\n    React.createElement(\n      ${route.component},\n      props\n    )\n  ),\n`;
      }
    });

    routeMappings += '};\n\n';
    routeMappings += 'export const PluginRoutes = Object.keys(App);\n';

    const finalOutput = UglifyJS.minify(`${importStatements}\n${routeMappings}`);
    fs.writeFile('./src/exports.js', finalOutput.code);
  });
}

// main().catch((err) => console.log(err));
