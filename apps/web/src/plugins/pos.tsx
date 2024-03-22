import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import { PluginRoutes } from '@lawallet/pos';
import dynamic from 'next/dynamic';
import { metadata } from '@lawallet/pos/metadata';

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
