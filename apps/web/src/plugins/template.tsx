import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginRoutes } from '@lawallet/plugin-template';
import { metadata } from '@lawallet/plugin-template/metadata';
import dynamic from 'next/dynamic';
import { PluginProps } from './plugins.d';

export const templatePlugin: PluginProps = {
  metadata,
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('@lawallet/plugin-template').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
