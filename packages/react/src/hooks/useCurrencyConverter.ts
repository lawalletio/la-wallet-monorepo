import { decimalsToUse, parseContent, roundToDown } from '@lawallet/utils';
import { type AvailableCurrencies } from '@lawallet/utils/types';
import * as React from 'react';
import { useConfig } from './useConfig.js';

const ENDPOINT_PRICE_BTC: string = 'https://api.yadio.io/exrates/btc';
const UPDATE_PRICES_TIME: number = 60 * 1000;

const mSats: number = 1000;
const scaledBTC_to_mSats: number = 10 ** 8 * mSats;

type PricesInfo = Record<AvailableCurrencies, number>;

export type UseConverterReturns = {
  pricesData: PricesInfo;
  convertCurrency: (amount: number, currencyA: AvailableCurrencies, currencyB: AvailableCurrencies) => number;
};

export const useCurrencyConverter = (): UseConverterReturns => {
  const config = useConfig();
  const [pricesData, setPricesData] = React.useState<PricesInfo>({
    ARS: 0,
    USD: 0,
    MSAT: 1,
    SAT: 1 / mSats,
    BTC: scaledBTC_to_mSats,
  });

  const convertCurrency = (amount: number, currencyA: AvailableCurrencies, currencyB: AvailableCurrencies): number => {
    let convertedAmount: number = 0;
    if (!pricesData[currencyA] || !pricesData[currencyB]) return convertedAmount;

    const multiplier: number = pricesData[currencyB] / pricesData[currencyA];
    convertedAmount = amount * multiplier;

    return Number(roundToDown(convertedAmount, 8).toFixed(decimalsToUse(currencyB)));
  };

  const requestUpdatedPrices = (): Promise<PricesInfo | false> => {
    return fetch(ENDPOINT_PRICE_BTC)
      .then((res) => res.json())
      .then((pricesResponse) => {
        const BTCPrices = pricesResponse.BTC;
        if (!BTCPrices) return false;

        const updatedPrices: PricesInfo = {
          MSAT: 1,
          SAT: 1 / mSats,
          BTC: scaledBTC_to_mSats,
          ARS: BTCPrices.ARS / scaledBTC_to_mSats,
          USD: BTCPrices.USD / scaledBTC_to_mSats,
        };

        return updatedPrices;
      });
  };

  const updatePrices = async () => {
    try {
      const updatedPrices: PricesInfo | false = await requestUpdatedPrices();
      if (!updatedPrices) return;

      await config.storage.setItem('prices', JSON.stringify({ ...updatedPrices, lastUpdated: Date.now() }));

      setPricesData(updatedPrices);
    } catch (err) {
      console.log(err);
    }
  };

  const loadPrices = async () => {
    const storagedPrices: string = (await config.storage.getItem('prices')) as string;
    if (!storagedPrices) {
      updatePrices();
      return;
    }

    const parsedPrices = parseContent(storagedPrices);
    setPricesData(parsedPrices);

    if (parsedPrices.lastUpdated + UPDATE_PRICES_TIME < Date.now()) {
      updatePrices();
      return;
    }
  };

  React.useEffect(() => {
    loadPrices();
  }, []);

  return { pricesData, convertCurrency };
};
