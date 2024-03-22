import { AppIndex } from './app';
import { PayDesk } from './app/paydesk';

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': AppIndex,
  '/paydesk': PayDesk,
};

export const PluginRoutes = Object.keys(App);
