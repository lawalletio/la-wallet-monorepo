import { type LNRequestResponse } from '../types/transaction.js';

export type CheckInvoiceReturns = {
  handled: boolean;
  comment: string;
  zapRequest: string;
  pubkey: string;
};

export const getPayRequest = (url: string): Promise<LNRequestResponse> =>
  fetch(url)
    .then((res) => {
      if (res.status !== 200) return null;
      return res.json();
    })
    .then((walletInfo) => {
      if (!walletInfo) return null;
      return walletInfo;
    })
    .catch(() => null);

export const requestInvoice = (callback: string) =>
  fetch(callback)
    .then((res) => res.json())
    .then((invoiceInfo) => (invoiceInfo && invoiceInfo.pr ? invoiceInfo.pr.toLowerCase() : ''))
    .catch(() => '');

// export const isInternalInvoice = (
//   invoiceHash: string
// ): Promise<CheckInvoiceReturns | null> =>
//   fetch(`${config.API_GATEWAY_ENDPOINT}/invoice/${invoiceHash}`)
//     .then(res => {
//       if (res.status !== 200) return null
//       return res.json()
//     })
//     .then(invoiceResponse => {
//       if (!invoiceResponse) return null
//       return invoiceResponse
//     })
//     .catch(() => null)
