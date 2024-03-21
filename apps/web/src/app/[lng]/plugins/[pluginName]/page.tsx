'use client';
import SpinnerView from '@/components/Spinner/SpinnerView';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const PLUGINS = {
  boltz: dynamic(() => import('@lawallet/boltz').then((mod) => mod.AppIndex), {
    ssr: false,
    loading: () => <SpinnerView />,
  }),
  plugin: dynamic(() => import('@lawallet/plugin').then((mod) => mod.AppIndex), {
    ssr: false,
    loading: () => <SpinnerView />,
  }),
};

export default function Page({ params }) {
  const router = useRouter();
  const App = PLUGINS[params.pluginName];

  return App ? <App /> : router.push('/plugins');
}
