import dynamic from 'next/dynamic';
import SpinnerView from '@/components/Spinner/SpinnerView';
import { ComponentType } from 'react';

type RouteProps = {
  path: string;
  component: ComponentType;
};

type PluginProps = {
  metadata: {
    author: string;
    title: string;
    description: string;
  };
  routes: RouteProps[];
};

export const PLUGINS: Record<string, PluginProps> = {
  boltz: {
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
  },
  plugin: {
    metadata: {
      author: 'LaWallet Labs',
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
