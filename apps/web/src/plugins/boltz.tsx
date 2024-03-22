import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import dynamic from 'next/dynamic';

export const boltzPlugin: PluginProps = {
  metadata: {
    author: 'LaWallet Labs',
    title: 'Boltz',
    description: 'Boltz exchange plugin',
  },
  routes: [
    {
      path: '/',
      component: dynamic(() => import('@lawallet/boltz').then((mod) => mod.App['/']), {
        ssr: false,
        loading: () => <SpinnerView />,
      }),
    },
    {
      path: '/test',
      component: dynamic(() => import('@lawallet/boltz').then((mod) => mod.App['/test']), {
        ssr: false,
        loading: () => <SpinnerView />,
      }),
    },
  ],
};
