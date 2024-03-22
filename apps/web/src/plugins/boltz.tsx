import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import { PluginRoutes } from '@lawallet/boltz';
import { metadata } from '@lawallet/boltz/metadata';
import dynamic from 'next/dynamic';

export const boltzPlugin: PluginProps = {
  metadata,
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('@lawallet/boltz').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
