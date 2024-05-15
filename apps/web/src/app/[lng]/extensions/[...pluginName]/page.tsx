'use client';
import BackButton from '@/components/BackButton';
import { PLUGINS } from '@/config/exports/extensions';
import { Navbar } from '@lawallet/ui';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type RouteWithParams = {
  component: React.ComponentType<React.JSX.Element>;
  params: Record<string, string>;
};

const getDynamicView = (pluginName: string, pathStr: string): RouteWithParams => {
  const plugin = PLUGINS[pluginName];
  let routeWithParams: RouteWithParams | undefined;

  for (const route of plugin.routes) {
    const { path, component } = route;
    const isDynamicRoute = path.includes(':');

    if (isDynamicRoute) {
      const pattern = path.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = pathStr.match(regex);

      if (match) {
        const params: Record<string, string> = {};
        const pathSegments = path.split('/');
        const matchSegments = pathStr.split('/');

        pathSegments.forEach((segment, index) => {
          if (segment.startsWith(':')) {
            const paramName = segment.substring(1);
            params[paramName] = matchSegments[index];
          }
        });

        routeWithParams = { component, params };
        break;
      }
    } else if (path === pathStr) {
      routeWithParams = { component, params: {} };
      break;
    }
  }

  if (!routeWithParams) {
    throw new Error('Route not found');
  }

  return routeWithParams;
};

export default function Page({ params }) {
  const router = useRouter();
  const [pluginRoute, setPluginRoute] = useState<string>('/');

  const pluginName = params.pluginName[0];

  const ComponentInfo = useMemo(() => {
    return getDynamicView(pluginName, pluginRoute);
  }, [pluginName, pluginRoute]);

  useEffect(() => {
    if (params.pluginName.length > 1) {
      let pRoute = '';
      params.pluginName.forEach((route: string) => {
        if (route !== pluginName) pRoute = `${pRoute}/${route}`;
      });

      setPluginRoute(pRoute);
    }
  }, [params.pluginName]);

  return ComponentInfo ? (
    <>
      <Navbar title={PLUGINS[pluginName].metadata.title} leftButton={<BackButton />} />
      <ComponentInfo.component props={ComponentInfo.params} type="" key="" />
    </>
  ) : (
    router.push('/plugins')
  );
}
