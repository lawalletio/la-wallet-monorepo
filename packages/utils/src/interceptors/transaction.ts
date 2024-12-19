import { differenceInSeconds } from 'date-fns';
import { baseConfig } from '../constants/constants.js';
import type { ConfigProps } from '../types/config.js';
import { type LNRequestResponse } from '../types/transaction.js';
import { fetchWithProxy, nowInSeconds } from '../utils/utilities.js';

export type CheckInvoiceReturns = {
  handled: boolean;
  comment: string;
  zapRequest: string;
  pubkey: string;
};

export const getPayRequest = async (url: string, config: ConfigProps = baseConfig): Promise<LNRequestResponse> => {
  const cachedResponse = await config.storage.getItem(url);

  if (cachedResponse) {
    const parsedResponse = JSON.parse(cachedResponse);
    const difference = differenceInSeconds(parsedResponse.expiry, nowInSeconds());

    if (difference > 60) {
      config.storage.removeItem(url);
    } else {
      return parsedResponse;
    }
  }

  return fetchWithProxy(url, config)
    .then((res) => {
      if (res.status !== 200) return null;
      return res.json();
    })
    .then((walletInfo) => {
      if (!walletInfo) return null;

      config.storage.setItem(url, JSON.stringify({ ...walletInfo, expiry: nowInSeconds() }));
      return walletInfo;
    })
    .catch(() => null);
};

export const requestInvoice = (callback: string, config: ConfigProps = baseConfig) =>
  fetchWithProxy(callback, config)
    .then((res) => res.json())
    .then((invoiceInfo) => (invoiceInfo && invoiceInfo.pr ? invoiceInfo.pr.toLowerCase() : ''))
    .catch(() => '');
