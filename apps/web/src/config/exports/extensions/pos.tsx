import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginRoutes } from '@lawallet/pos';
import { metadata } from '@lawallet/pos/metadata';
import dynamic from 'next/dynamic';
import { PluginProps } from './plugins.d';

export const posPlugin: PluginProps = {
  metadata,
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('@lawallet/pos').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
