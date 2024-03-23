import React, { ReactNode } from 'react';
import { InjectedNFCProvider } from '../../../context/InjectedNFC';
import { LNProvider } from '../../../context/LN';
import { OrderProvider } from '../../../context/Order';
import { NostrProvider } from '../../../context/Nostr';

export const PaymentLayout = ({ children }: { children: ReactNode }) => {
  return (
    <InjectedNFCProvider>
      <LNProvider>
        <NostrProvider>
          <OrderProvider>{children}</OrderProvider>
        </NostrProvider>
      </LNProvider>
    </InjectedNFCProvider>
  );
};
