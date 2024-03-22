import React from 'react';
import { LNProvider } from '../../context/LN';
import { NostrProvider } from '../../context/Nostr';
import { OrderProvider } from '../../context/Order';
import { PayDesk } from '.';

export const PayDeskLayout = () => {
  return (
    <LNProvider>
      <NostrProvider>
        <OrderProvider>
          <PayDesk />
        </OrderProvider>
      </NostrProvider>
    </LNProvider>
  );
};
