import React from 'react';
import { AppIndex } from './app';
import { PayDeskLayout } from './app/paydesk/layout';
import { PayDesk } from './app/paydesk/page';
import { PaymentPage } from './app/payment/[orderId]/page';
import { PaymentLayout } from './app/payment/[orderId]/layout';

type AppProps = Record<string, (props?: Record<string, any>) => React.JSX.Element>;

export const App: AppProps = {
  '/': () => <AppIndex />,
  '/paydesk': () => (
    <PayDeskLayout>
      <PayDesk />
    </PayDeskLayout>
  ),
  '/payment/:id': (props) => (
    <PaymentLayout>
      <PaymentPage {...props} />
    </PaymentLayout>
  ),
};

export const PluginRoutes = Object.keys(App);
