import { baseConfig, defaultTransfer } from '../constants/constants.js';
import { getUserPubkey } from '../interceptors/identity.js';
import { getPayRequest, requestInvoice, type TransferInformation } from '../interceptors/transaction.js';
import { type ConfigProps } from '../types/config.js';
import { TransferTypes } from '../types/transaction.js';
import bolt11 from '../libs/light-bolt11.js';
import { lnurl_decode } from '../libs/lnurl.js';

export const decodeInvoice = (invoice: string) => {
  const decodedInvoice = bolt11.decode(invoice);
  return decodedInvoice;
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
  if (isLUD16) {
    const [username, domain] = splitHandle(upperStr);
    if (!username || !domain) return TransferTypes.NONE;

    return domain.toUpperCase() === baseConfig.federation.domain.toUpperCase()
      ? TransferTypes.INTERNAL
      : TransferTypes.LUD16;
  }

  if (upperStr.startsWith('LNURL')) return TransferTypes.LNURL;
  if (upperStr.startsWith('LNBC')) return TransferTypes.INVOICE;

  if (data.length > 15) return TransferTypes.NONE;
  return TransferTypes.INTERNAL;
};

const parseInvoiceInfo = (invoice: string) => {
  const decodedInvoice = decodeInvoice(invoice);
  const invoiceAmount = decodedInvoice.sections.find((section: Record<string, string>) => section.name === 'amount');

  if (!invoiceAmount) return defaultTransfer;

  const createdAt = decodedInvoice.sections.find((section: Record<string, string>) => section.name === 'timestamp');

  const transfer: TransferInformation = {
    ...defaultTransfer,
    data: invoice.toLowerCase(),
    type: TransferTypes.INVOICE,
    amount: invoiceAmount.value / 1000,
    expired: false,
  };

  if (createdAt && createdAt.value) {
    const expirationDate: number = (createdAt.value + decodedInvoice.expiry) * 1000;
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
  if (domain === config.federation.domain && username) return `${username}@${domain}`;

  return '';
};

const parseLNURLInfo = async (data: string) => {
  const decodedLNURL = lnurl_decode(data);
  const internalLUD16: string = isInternalLNURL(decodedLNURL);
  if (internalLUD16.length) return parseINTERNALInfo(internalLUD16);

  const payRequest = await getPayRequest(decodedLNURL);
  if (!payRequest) return defaultTransfer;

  const transfer: TransferInformation = {
    ...defaultTransfer,
    data,
    type: TransferTypes.LNURL,
    payRequest,
  };

  if (payRequest.tag === 'payRequest') {
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

export const splitHandle = (handle: string): string[] => {
  if (!handle.length) return [];

  if (handle.includes('@')) {
    const [username, domain] = handle.split('@');
    return [username!, domain!];
  } else {
    return [handle, baseConfig.federation.domain];
  }
};

const parseLUD16Info = async (data: string) => {
  const [username, domain] = splitHandle(data);
  const payRequest = await getPayRequest(`https://${domain}/.well-known/lnurlp/${username}`);
  if (!payRequest) return defaultTransfer;

  const transfer: TransferInformation = {
    ...defaultTransfer,
    data,
    type: TransferTypes.LUD16,
    payRequest,
  };

  if (payRequest.minSendable == payRequest.maxSendable) transfer.amount = payRequest.maxSendable! / 1000;

  return transfer;
};

const parseINTERNALInfo = async (data: string) => {
  const [username] = splitHandle(data);
  const receiverPubkey: string = await getUserPubkey(username!);
  if (!receiverPubkey) return defaultTransfer;

  const transfer: TransferInformation = {
    ...defaultTransfer,
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

export const formatTransferData = async (data: string): Promise<TransferInformation> => {
  if (!data.length) return defaultTransfer;
  const cleanStr: string = removeLightningStandard(data);

  const decodedTransferType: TransferTypes = detectTransferType(cleanStr);
  if (decodedTransferType === TransferTypes.NONE) return defaultTransfer;

  switch (decodedTransferType) {
    case TransferTypes.INVOICE:
      return parseInvoiceInfo(cleanStr);

    case TransferTypes.LNURL:
      return parseLNURLInfo(cleanStr);

    case TransferTypes.LUD16:
      return parseLUD16Info(cleanStr);

    default:
      return parseINTERNALInfo(cleanStr);
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
