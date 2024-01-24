import { useEffect, useState } from 'react';
import { decodeInvoice, defaultInvoiceTransfer, parseInvoiceInfo } from '@lawallet/utils';
import {
  TransferTypes,
  type ConfigParameter,
  type InvoiceTransferType,
  type DecodedInvoiceReturns,
} from '@lawallet/utils/types';
import { useTransfer } from './useTransfer.js';
import type { StatusVarsTypes } from './useStatusVars.js';

export interface UseInvoiceReturns extends StatusVarsTypes {
  parsedInvoice: InvoiceTransferType;
  decodedInvoice: DecodedInvoiceReturns | undefined;
  execute: () => Promise<boolean>;
}

interface UseInvoiceParameters extends ConfigParameter {
  bolt11?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useInvoice = (params: UseInvoiceParameters): UseInvoiceReturns => {
  const { error, isLoading, isError, isSuccess, execOutboundTransfer } = useTransfer({ ...params, tokenName: 'BTC' });
  const [parsedInvoice, setParsedInvoice] = useState<InvoiceTransferType>(defaultInvoiceTransfer);
  const [decodedInvoice, setDecodedInvoice] = useState<DecodedInvoiceReturns | undefined>(undefined);

  const initializeInvoice = async (data: string) => {
    const decoded = decodeInvoice(data);
    if (!decoded) return;

    setDecodedInvoice(decoded);

    const transferInfo: InvoiceTransferType = parseInvoiceInfo(decoded);
    if (transferInfo.type !== TransferTypes.INVOICE) return;

    setParsedInvoice(transferInfo);
  };

  const execute = async () => {
    if (!params.bolt11) return false;
    return execOutboundTransfer({ bolt11: parsedInvoice.data, amount: parsedInvoice.amount });
  };

  useEffect(() => {
    if (params.bolt11) initializeInvoice(params.bolt11);
  }, [params.bolt11]);

  return { error, isLoading, isError, isSuccess, parsedInvoice, decodedInvoice, execute };
};
