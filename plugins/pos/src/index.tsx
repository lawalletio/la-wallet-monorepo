import React from 'react';
import { AppIndex } from './app';
import { PayDeskLayout } from './app/paydesk/layout';
import { PayDesk } from './app/paydesk/page';

type AppProps = Record<string, () => React.JSX.Element>;

export const App: AppProps = {
  '/': () => <AppIndex />,
  '/paydesk': () => (
    <PayDeskLayout>
      <PayDesk />
    </PayDeskLayout>
  ),
};

export const PluginRoutes = Object.keys(App);
