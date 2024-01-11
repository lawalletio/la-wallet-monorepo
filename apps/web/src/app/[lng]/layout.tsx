"use client";

import { ThemeProvider } from "styled-components";

import StyledComponentsRegistry from "@/utils/registry";

import config from "@/constants/config";

import { TranslateProvider } from "@/context/TranslateContext";
import GlobalStyles from "@/styles/GlobalStyles";
import { fontSecondary } from "@/styles/fonts";
import theme from "@/styles/theme";
import Script from "next/script";
import { ReactNode } from "react";
import {
  AvailableLanguages,
  LaWalletProvider,
  defaultLocale,
} from "@lawallet/react";
import AuthProvider from "@/components/Auth/AuthProvider";

interface ProviderProps {
  children: ReactNode;
  params: { lng: AvailableLanguages };
}

// Metadata
const APP_NAME = "LaWallet";
const APP_DESCRIPTION = "https://lawallet.ar/";

const Providers = (props: ProviderProps) => {
  const { children, params } = props;

  return (
    <html
      lang={params.lng ?? defaultLocale}
      className={fontSecondary.className}
    >
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

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-192x192.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${config.env.GOOGLE_TAG_ID}`}
        />
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', '${config.env.GOOGLE_TAG_ID}');
        `}
        </Script>
      </head>

      <body>
        <StyledComponentsRegistry>
          <GlobalStyles />
          <TranslateProvider lng={params.lng}>
            <LaWalletProvider>
              <AuthProvider>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
              </AuthProvider>
            </LaWalletProvider>
          </TranslateProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
};

export default Providers;
