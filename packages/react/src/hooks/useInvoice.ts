import { useEffect, useState } from 'react';
import { type TransferInformation } from '@lawallet/utils/actions';
import { defaultTransfer, formatTransferData } from '@lawallet/utils';
import { TransferTypes, type ConfigParameter } from '@lawallet/utils/types';
import { useTransfer } from './useTransfer.js';
import type { StatusVarsTypes } from './useStatusVars.js';

export interface UseInvoiceReturns extends StatusVarsTypes {
  invoiceInfo: TransferInformation;
  execute: () => Promise<boolean>;
}

interface UseInvoiceParameters extends ConfigParameter {
  bolt11?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useInvoice = (params: UseInvoiceParameters): UseInvoiceReturns => {
  const { error, isLoading, isError, isSuccess, execOutboundTransfer } = useTransfer({ ...params, tokenName: 'BTC' });
  const [invoiceInfo, setInvoiceInfo] = useState<TransferInformation>(defaultTransfer);

  const initializeInvoice = async (data: string) => {
    const transferInfo: TransferInformation = await formatTransferData(data);
    if (transferInfo.type !== TransferTypes.INVOICE) return;

    setInvoiceInfo(transferInfo);
  };

  const execute = async () => {
    if (!params.bolt11) return false;
    return execOutboundTransfer({ bolt11: invoiceInfo.data, amount: invoiceInfo.amount });
  };

  useEffect(() => {
    if (params.bolt11) initializeInvoice(params.bolt11);
  }, [params.bolt11]);

  return { error, isLoading, isError, isSuccess, invoiceInfo, execute };
};
