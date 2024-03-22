'use client';

import { TokensList } from '@lawallet/ui';
import React from 'react';

import { CurrenciesList, useWalletContext } from '@lawallet/react';
import { AvailableCurrencies } from '@lawallet/react/types';

export function TokenList() {
  const { settings } = useWalletContext();

  return (
    <TokensList
      currenciesList={CurrenciesList}
      selectedCurrency={settings.props.currency}
      onClick={(currency: string) => settings.changeCurrency(currency as AvailableCurrencies)}
    />
  );
}
