import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import { PluginRoutes } from '@lawallet/plugin-template';
import { metadata } from '@lawallet/plugin-template/metadata';
import dynamic from 'next/dynamic';

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
