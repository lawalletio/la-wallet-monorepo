import { AppIndex } from './app';
import { PayDeskLayout } from './app/paydesk/layout';

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': AppIndex,
  '/paydesk': PayDeskLayout,
};

export const PluginRoutes = Object.keys(App);
