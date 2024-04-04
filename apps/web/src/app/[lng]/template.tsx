'use client';

import AuthProvider from '@/components/Auth/AuthProvider';
import { appTheme, config } from '@/config/exports';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { LaWalletProvider } from '@lawallet/react';
import { NextProvider } from '@lawallet/ui/next';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <NextProvider theme={appTheme}>
      <LaWalletProvider config={config}>
        <AuthProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </AuthProvider>
      </LaWalletProvider>
    </NextProvider>
  );
}
