import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import { PluginRoutes } from '@lawallet/pos';
import dynamic from 'next/dynamic';

export const posPlugin: PluginProps = {
  metadata: {
    author: 'LaWallet Labs',
    title: 'Pos plugin',
    description: 'A test plugin',
  },
  routes: PluginRoutes.map((route: string) => ({
    path: route,
    component: dynamic(() => import('@lawallet/pos').then((mod) => mod.App[route]), {
      ssr: false,
      loading: () => <SpinnerView />,
    }),
  })),
};
