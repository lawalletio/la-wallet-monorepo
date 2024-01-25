import { baseConfig, defaultInvoiceTransfer, defaultLNURLTransfer } from '../constants/constants.js';
import { getUserPubkey } from '../interceptors/identity.js';
import { getPayRequest, requestInvoice } from '../interceptors/transaction.js';
import { type ConfigProps } from '../types/config.js';
import { TransferTypes, type InvoiceTransferType, type LNURLTransferType } from '../types/transaction.js';
import bolt11 from '../libs/light-bolt11.js';
import { lnurl_decode } from '../libs/lnurl.js';
import type { DecodedInvoiceReturns } from '../types/bolt11.js';

export const decodeInvoice = (invoice: string): DecodedInvoiceReturns | undefined => {
  try {
    const decodedInvoice = bolt11.decode(invoice);
    return decodedInvoice;
  } catch {
    return;
  }
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

export const detectTransferType = (data: string, config: ConfigProps = baseConfig): TransferTypes => {
  if (!data.length) return TransferTypes.NONE;

  const upperStr: string = data.toUpperCase();
  const isLUD16 = validateEmail(upperStr);
  if (isLUD16) {
    const [username, domain] = splitHandle(upperStr, config);
    if (!username || !domain) return TransferTypes.NONE;

    return domain.toUpperCase() === config.federation.domain.toUpperCase()
      ? TransferTypes.INTERNAL
      : TransferTypes.LUD16;
  }

  if (upperStr.startsWith('LNURL')) return TransferTypes.LNURL;
  if (upperStr.startsWith('LNBC')) return TransferTypes.INVOICE;

  if (data.length > 15) return TransferTypes.NONE;
  return TransferTypes.INTERNAL;
};

export const parseInvoiceInfo = (decodedInvoice: DecodedInvoiceReturns) => {
  if (!decodedInvoice || !decodedInvoice.paymentRequest) return defaultInvoiceTransfer;

  const invoiceAmount: number = Number(decodedInvoice.millisatoshis);
  if (!invoiceAmount) return defaultInvoiceTransfer;

  const createdAt = decodedInvoice.timestamp;

  const transfer: InvoiceTransferType = {
    ...defaultInvoiceTransfer,
    data: decodedInvoice.paymentRequest.toLowerCase(),
    type: TransferTypes.INVOICE,
    amount: invoiceAmount / 1000,
    expired: false,
  };

  if (createdAt && createdAt) {
    const expirationDate: number = (createdAt + Number(decodedInvoice.timeExpireDate)) * 1000;
    if (expirationDate < Date.now()) transfer.expired = true;
  }

  return transfer;
};

const removeHttpOrHttps = (str: string) => {
  if (str.startsWith('http://')) return str.replace('http://', '');
  if (str.startsWith('https://')) return str.replace('https://', '');

  return str;
};

const isInternalLNURL = (decodedLNURL: string, config: ConfigProps = baseConfig): string => {
  const urlWithoutHttp: string = removeHttpOrHttps(decodedLNURL);
  const [domain, , , username] = urlWithoutHttp.split('/');
  if (username && domain && domain.toUpperCase() === config.federation.domain.toUpperCase())
    return `${username}@${domain}`;

  return '';
};

const parseLNURLInfo = async (data: string, config: ConfigProps = baseConfig) => {
  const decodedLNURL = lnurl_decode(data);
  const internalLUD16: string = isInternalLNURL(decodedLNURL, config);
  if (internalLUD16.length) return parseINTERNALInfo(internalLUD16);

  const payRequest = await getPayRequest(decodedLNURL);
  if (!payRequest) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.LNURL,
    request: payRequest,
  };

  if (payRequest && payRequest.tag === 'payRequest') {
    try {
      const parsedMetadata: Array<string>[] = JSON.parse(payRequest.metadata);
      const identifier: string[] | undefined = parsedMetadata.find((data: string[]) => {
        if (data[0] === 'text/identifier') return data;
      });

      if (identifier && identifier.length === 2) transfer.data = identifier[1]!;
    } catch (error) {
      console.log(error);
    }
  } else if (payRequest.tag === 'withdrawRequest') {
    transfer.type = TransferTypes.LNURLW;
    transfer.amount = payRequest.maxWithdrawable! / 1000;
  }

  return transfer;
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

const parseLUD16Info = async (data: string, config: ConfigProps = baseConfig) => {
  const [username, domain] = splitHandle(data, config);
  const payRequest = await getPayRequest(`https://${domain}/.well-known/lnurlp/${username}`);
  if (!payRequest) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.LUD16,
    request: payRequest,
  };

  if (payRequest.minSendable == payRequest.maxSendable) transfer.amount = payRequest.maxSendable! / 1000;

  return transfer;
};

const parseINTERNALInfo = async (data: string, config: ConfigProps = baseConfig) => {
  const [username] = splitHandle(data, config);
  const receiverPubkey: string = await getUserPubkey(username!, config);
  if (!receiverPubkey) return defaultLNURLTransfer;

  const transfer: LNURLTransferType = {
    ...defaultLNURLTransfer,
    data,
    type: TransferTypes.INTERNAL,
    receiverPubkey,
  };

  return transfer;
};

export const removeLightningStandard = (str: string) => {
  const lowStr: string = str.toLowerCase();

  return lowStr.startsWith('lightning://')
    ? lowStr.replace('lightning://', '')
    : lowStr.startsWith('lightning:')
      ? lowStr.replace('lightning:', '')
      : lowStr;
};

export const formatLNURLData = async (data: string, config: ConfigProps = baseConfig): Promise<LNURLTransferType> => {
  if (!data.length) return defaultLNURLTransfer;
  const cleanStr: string = removeLightningStandard(data);

  const decodedTransferType: TransferTypes = detectTransferType(cleanStr, config);
  if (decodedTransferType === TransferTypes.NONE) return defaultLNURLTransfer;

  switch (decodedTransferType) {
    case TransferTypes.INVOICE:
      return defaultLNURLTransfer;

    case TransferTypes.LNURL:
      return parseLNURLInfo(cleanStr, config);

    case TransferTypes.LUD16:
      return parseLUD16Info(cleanStr, config);

    default:
      return parseINTERNALInfo(cleanStr, config);
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
