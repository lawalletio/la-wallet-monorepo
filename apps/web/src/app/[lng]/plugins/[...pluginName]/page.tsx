'use client';
import { PLUGINS } from '@/config/plugins';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const getDynamicView = (pluginName: string, pathStr: string) => {
  const route = PLUGINS[pluginName].routes.find(({ path, component }) => {
    if (path === pathStr) return component;
  });

  if (!route) {
    throw new Error('Route not found');
  }

  return route.component;
};

export default function Page({ params }) {
  const router = useRouter();
  const [pluginRoute, setPluginRoute] = useState<string>('/');

  const pluginName = params.pluginName[0];
  const Component = useMemo(() => {
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

  return Component ? <Component /> : router.push('/plugins');
}
