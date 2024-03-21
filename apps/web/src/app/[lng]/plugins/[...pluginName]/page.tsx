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
  // const [pluginRoute, setPluginRoute] = useState<string>('');
  const router = useRouter();
  const App = PLUGINS[params.pluginName[0]];

  // const route: string = params.pluginName.map((routeName: string) => )
  // useEffect(() => {
  //   let pRoute = '';
  //   params.pluginName.forEach((route: string) => {
  //     pRoute = `${pRoute}/${route}`;
  //   });

  //   setPluginRoute(pRoute);
  // }, [params.pluginName]);

  // console.log(pluginRoute);

  return App ? <App /> : router.push('/plugins');
}
