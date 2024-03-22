import SpinnerView from '@/components/Spinner/SpinnerView';
import { PluginProps } from '@/types/plugins';
import dynamic from 'next/dynamic';

export const testPlugin: PluginProps = {
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
};
