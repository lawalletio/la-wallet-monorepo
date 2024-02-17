import { decodeInvoice, defaultInvoiceTransfer, parseInvoiceInfo } from '@lawallet/utils';
import {
  TransferTypes,
  type ConfigParameter,
  type DecodedInvoiceReturns,
  type InvoiceTransferType,
} from '@lawallet/utils/types';
import { useEffect, useState } from 'react';

export interface UseInvoiceReturns {
  txInfo: InvoiceTransferType;
  decodedInvoice: DecodedInvoiceReturns | undefined;
}

interface UseInvoiceParameters extends ConfigParameter {
  bolt11?: string;
  onSuccess?: () => void;
  onError?: (message?: string) => void;
}

export const useInvoice = (params: UseInvoiceParameters): UseInvoiceReturns => {
  const [txInfo, setTxInfo] = useState<InvoiceTransferType>(defaultInvoiceTransfer);
  const [decodedInvoice, setDecodedInvoice] = useState<DecodedInvoiceReturns | undefined>(undefined);

  const initializeInvoice = async (data: string) => {
    const decoded = decodeInvoice(data);
    if (!decoded) return;

    setDecodedInvoice(decoded);

    const transferInfo: InvoiceTransferType = parseInvoiceInfo(decoded);
    if (transferInfo.type !== TransferTypes.INVOICE) return;
    setTxInfo(transferInfo);
  };

  useEffect(() => {
    if (params.bolt11) initializeInvoice(params.bolt11);
  }, [params.bolt11]);

  return { txInfo, decodedInvoice };
};
