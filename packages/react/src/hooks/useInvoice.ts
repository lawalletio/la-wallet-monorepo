import { decodeInvoice, defaultInvoiceTransfer, parseInvoiceInfo } from '@lawallet/utils';
import {
  TransferTypes,
  type ConfigParameter,
  type DecodedInvoiceReturns,
  type InvoiceTransferType,
} from '@lawallet/utils/types';
import * as React from 'react';

export interface UseInvoiceReturns {
  txInfo: InvoiceTransferType;
  decodedInvoice: DecodedInvoiceReturns | undefined;
}

interface UseInvoiceParameters extends ConfigParameter {
  bolt11?: string;
}

export const useInvoice = (params: UseInvoiceParameters): UseInvoiceReturns => {
  const [txInfo, setTxInfo] = React.useState<InvoiceTransferType>(defaultInvoiceTransfer);
  const [decodedInvoice, setDecodedInvoice] = React.useState<DecodedInvoiceReturns | undefined>(undefined);

  const initializeInvoice = async (data: string) => {
    const decoded = decodeInvoice(data);
    if (!decoded) return;

    setDecodedInvoice(decoded);

    const transferInfo: InvoiceTransferType = parseInvoiceInfo(decoded);
    if (transferInfo.type !== TransferTypes.INVOICE) return;
    setTxInfo(transferInfo);
  };

  React.useEffect(() => {
    if (params.bolt11) initializeInvoice(params.bolt11);
  }, [params.bolt11]);

  return { txInfo, decodedInvoice };
};
