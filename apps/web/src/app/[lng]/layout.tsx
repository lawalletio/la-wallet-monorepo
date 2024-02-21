'use client';
import StyledComponentsRegistry from '@/utils/registry';

import { TranslateProvider } from '@/context/TranslateContext';
import { ReactNode } from 'react';
import { AvailableLanguages } from '@lawallet/react/types';
import { LaWalletProvider, defaultLocale } from '@lawallet/react';
import AuthProvider from '@/components/Auth/AuthProvider';
import { config } from '../../../config/federationConfig';
import { NotificationsProvider } from '@/context/NotificationsContext';

import { fontPrimary, fontSecondary } from '@/styles/fonts';

interface ProviderProps {
  children: ReactNode;
  params: { lng: AvailableLanguages };
}

// Metadata
const APP_NAME = 'LaWallet';
const APP_DESCRIPTION = 'https://lawallet.ar/';

const Providers = (props: ProviderProps) => {
  const { children, params } = props;
  return (
    <html lang={params.lng ?? defaultLocale} className={`${fontPrimary.variable} ${fontSecondary.variable}`}>
      <head>
        <title>{APP_NAME}</title>
        <meta name="application-name" content={APP_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1C1C1C" />
        {/* TIP: set viewport head meta tag in _app.js, otherwise it will show a warning */}
        {/* <meta
          name='viewport'
          content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover'
        /> */}

        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Fonts */}
        {/* <link rel="preload" href="/fonts/IAAB3.woff2" as="font" type="font/woff2" />
        <link rel="preload" href="/fonts/SF-Regular.woff2" as="font" type="font/woff2" />
        <link rel="preload" href="/fonts/SF-Bold.woff2" as="font" type="font/woff2" /> */}

        {/* <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_TAG_ID}`} />
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', '${process.env.GOOGLE_TAG_ID}');
        `}
        </Script> */}
      </head>

      <body>
        <StyledComponentsRegistry>
          <LaWalletProvider config={config}>
            <AuthProvider lng={params.lng}>
              <TranslateProvider lng={params.lng}>
                <NotificationsProvider>{children}</NotificationsProvider>
              </TranslateProvider>
            </AuthProvider>
          </LaWalletProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
};

export default Providers;
