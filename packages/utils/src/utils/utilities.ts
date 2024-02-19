import { baseConfig, defaultInvoiceTransfer, defaultLNURLTransfer } from '../constants/constants.js';
import { getPayRequest, requestInvoice } from '../interceptors/transaction.js';
import bolt11 from '../libs/light-bolt11.js';
import { lnurl_decode } from '../libs/lnurl.js';
import type { DecodedInvoiceReturns } from '../types/bolt11.js';
import { type ConfigProps } from '../types/config.js';
import { TransferTypes, type InvoiceTransferType, type LNURLTransferType } from '../types/transaction.js';

export const decodeInvoice = (invoice: string): DecodedInvoiceReturns | undefined => {
  try {
    const decodedInvoice = bolt11.decode(invoice);
    return decodedInvoice;
  } catch {
    return;
  }
};

export const removeDuplicateArray = (arr: any[]) => {
  return [...new Set(arr)];
};

export const validateEmail = (email: string): RegExpMatchArray | null => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
};

export const nowInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

function addQueryParameter(url: string, parameter: string) {
  if (url.indexOf('?') === -1) {
    return url + '?' + parameter;
  } else {
    return url + '&' + parameter;
  }
}

export const claimLNURLw = async (
  toNpub: string,
  callback: string,
  k1: string,
  amount: number,
  config: ConfigProps = baseConfig,
): Promise<boolean> => {
  if (!callback || !k1 || !amount) return false;

  try {
    const pr: string = await requestInvoice(`${config.endpoints.api}/lnurlp/${toNpub}/callback?amount=${amount}`);
    if (!pr) return false;

    let urlCallback: string = callback;
    urlCallback = addQueryParameter(urlCallback, `k1=${k1}`);
    urlCallback = addQueryParameter(urlCallback, `pr=${pr}`);

    return fetch(urlCallback).then((res) => {
      return res.status === 200;
    });
  } catch {
    return false;
  }
};

export const detectTransferType = (data: string): TransferTypes => {
  if (!data.length) return TransferTypes.NONE;

  const upperStr: string = data.toUpperCase();
  const isLUD16 = validateEmail(upperStr);
  if (isLUD16) return TransferTypes.LUD16;

  if (upperStr.startsWith('LNURL')) return TransferTypes.LNURL;
  if (upperStr.startsWith('LNBC')) return TransferTypes.INVOICE;

  if (data.length > 15) return TransferTypes.NONE;
  return TransferTypes.INTERNAL;
};

export const parseInvoiceInfo = (decodedInvoice: DecodedInvoiceReturns) => {
  if (!decodedInvoice || !decodedInvoice.paymentRequest) return defaultInvoiceTransfer;

  const invoiceAmount: number = Number(decodedInvoice.millisatoshis);
  if (!invoiceAmount) return defaultInvoiceTransfer;

  let transfer: InvoiceTransferType = {
    ...defaultInvoiceTransfer,
    data: decodedInvoice.paymentRequest.toLowerCase(),
    type: TransferTypes.INVOICE,
    amount: invoiceAmount / 1000,
    expired: false,
  };

  if (decodedInvoice.timeExpireDate && Number(decodedInvoice.timeExpireDate) * 1000 < Date.now())
    transfer.expired = true;

  return transfer;
};

const removeHttpOrHttps = (str: string) => {
  if (str.startsWith('http://')) return str.replace('http://', '');
  if (str.startsWith('https://')) return str.replace('https://', '');

  return str;
};

const parseLNURLInfo = async (data: string, config: ConfigProps = baseConfig): Promise<LNURLTransferType> => {
  const decodedLNURL = lnurl_decode(data);

  const payRequest = await getPayRequest(decodedLNURL);
  if (!payRequest) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.LNURL,
    receiverPubkey: config.modulePubkeys.urlx,
    request: payRequest,
  };

  if (payRequest.tag === 'withdrawRequest') {
    return {
      ...transfer,
      type: TransferTypes.LNURLW,
      receiverPubkey: config.modulePubkeys.urlx,
      amount: payRequest.maxWithdrawable! / 1000,
    };
  }

  const decodedWithoutHttps: string = removeHttpOrHttps(decodedLNURL).replace('www.', '');
  const [domain, username] = decodedWithoutHttps.includes('/.well-known/lnurlp/')
    ? decodedWithoutHttps.split('/.well-known/lnurlp/')
    : decodedWithoutHttps.split('/lnurlp/');

  if (payRequest && payRequest.tag === 'payRequest') {
    try {
      if (payRequest.federationId && payRequest.federationId === config.federation.id) {
        return {
          ...transfer,
          data: username && domain ? `${username}@${domain}` : data,
          type: TransferTypes.INTERNAL,
          receiverPubkey: payRequest.accountPubKey!,
        };
      } else {
        const parsedMetadata: Array<string>[] = JSON.parse(payRequest.metadata);
        const identifier: string[] | undefined = parsedMetadata.find((data: string[]) => {
          if (data[0] === 'text/identifier') return data;
        });

        if (identifier && identifier.length === 2)
          return { ...transfer, data: identifier[1]!, receiverPubkey: config.modulePubkeys.urlx };
      }
    } catch (error) {
      console.log(error);
    }
  }

  return {
    ...transfer,
    data: username && domain ? `${username}@${domain}` : data,
  };
};

export const splitHandle = (handle: string, config: ConfigProps = baseConfig): string[] => {
  if (!handle.length) return [];

  try {
    if (handle.includes('@')) {
      const [username, domain] = handle.split('@');
      return [username!, domain!];
    } else {
      return [handle, config.federation.domain];
    }
  } catch {
    return [];
  }
};

const parseLUD16Info = async (data: string, config: ConfigProps = baseConfig): Promise<LNURLTransferType> => {
  const [username, domain] = splitHandle(data, config);
  const payRequest = await getPayRequest(`https://${domain}/.well-known/lnurlp/${username}`);
  if (!payRequest) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.LUD16,
    request: payRequest,
  };

  if (payRequest.federationId && payRequest.federationId === config.federation.id) {
    return {
      ...transfer,
      type: TransferTypes.INTERNAL,
      receiverPubkey: payRequest.accountPubKey!,
    };
  }

  if (payRequest.minSendable == payRequest.maxSendable)
    return {
      ...transfer,
      amount: payRequest.maxSendable! / 1000,
      receiverPubkey: config.modulePubkeys.urlx,
    };

  return transfer;
};

export const removeLightningStandard = (str: string) => {
  const lowStr: string = str.toLowerCase();

  if (lowStr.startsWith('lightning://')) return lowStr.replace('lightning://', '');
  if (lowStr.startsWith('lightning:')) return lowStr.replace('lightning:', '');
  if (lowStr.startsWith('lnurlw://')) return lowStr.replace('lnurlw://', '');

  return lowStr;
};

export const formatLNURLData = async (data: string, config: ConfigProps = baseConfig): Promise<LNURLTransferType> => {
  if (!data.length) return defaultLNURLTransfer;
  const cleanStr: string = removeLightningStandard(data);

  const decodedTransferType: TransferTypes = detectTransferType(cleanStr);
  if (decodedTransferType === TransferTypes.NONE) return defaultLNURLTransfer;

  switch (decodedTransferType) {
    case TransferTypes.INVOICE:
      return defaultLNURLTransfer;

    case TransferTypes.LUD16:
      return parseLUD16Info(cleanStr, config);

    default:
      return parseLNURLInfo(cleanStr, config);
  }
};

export function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return {};
  }
}
