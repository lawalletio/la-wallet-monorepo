import { decimalsToUse, parseContent, roundToDown } from '@lawallet/utils';
import { type AvailableCurrencies } from '@lawallet/utils/types';
import * as React from 'react';
import { useConfig } from './useConfig.js';

const ENDPOINT_PRICE_BTC: string = 'https://api.yadio.io/exrates/btc';
const UPDATE_PRICES_TIME: number = 60 * 1000;
const scaledBTC: number = 10 ** 8;

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
    SAT: 1,
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
          ARS: BTCPrices.ARS / scaledBTC,
          USD: BTCPrices.USD / scaledBTC,
          SAT: 1,
        };

        return updatedPrices;
      });
  };

  const updatePrices = async () => {
    try {
      const updatedPrices: PricesInfo | false = await requestUpdatedPrices();
      if (!updatedPrices) return;

      config.storage.setItem('prices', JSON.stringify({ ...updatedPrices, lastUpdated: Date.now() }));

      setPricesData(updatedPrices);
    } catch (err) {
      console.log(err);
    }
  };

  const loadPrices = () => {
    const storagedPrices: string = config.storage.getItem('prices') as string;
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
