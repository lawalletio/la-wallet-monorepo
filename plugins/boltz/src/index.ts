import { AppIndex } from './app';
import { PruebaIndex } from './app/prueba';

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': AppIndex,
  '/test': PruebaIndex,
};

export const PluginRoutes = Object.keys(App);
