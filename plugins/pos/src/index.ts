import { AppIndex } from './app';

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': AppIndex,
};
