import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import dynamic from 'next/dynamic';

export const posPlugin: PluginProps = {
  metadata: {
    author: 'LaWallet Labs',
    title: 'Pos plugin',
    description: 'A test plugin',
  },
  routes: [
    {
      path: '/',
      component: dynamic(() => import('@lawallet/pos').then((mod) => mod.App['/']), {
        ssr: false,
        loading: () => <SpinnerView />,
      }),
    },
  ],
};
