/* eslint-disable prettier/prettier */
    import SpinnerView from '@/components/Spinner/SpinnerView';
    import { PluginRoutes } from 'nwc';
    import dynamic from 'next/dynamic';
  
    export default PluginRoutes.map((route) => ({
      path: route,
      getComponent: () => dynamic(() => import('nwc').then((mod) => mod.App[route]), {
        ssr: false,
        loading: () => <SpinnerView />,
      }),
    }));
  