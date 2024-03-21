import dynamic from 'next/dynamic';
import SpinnerView from '@/components/Spinner/SpinnerView';

export const PLUGINS = {
  boltz: {
    metadata: {
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
  },
  plugin: {
    metadata: {
      title: 'Plugin',
      description: 'A test plugin',
    },
    routes: [
      {
        path: '/',
        component: dynamic(() => import('@lawallet/plugin').then((mod) => mod.AppIndex), {
          ssr: false,
          loading: () => <SpinnerView />,
        }),
      },
    ],
  },
};
