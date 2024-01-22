import { escapingBrackets, useLNTransfer } from '@lawallet/react';
import { TransferInformation } from '@lawallet/react/actions';
import { TransferTypes } from '@lawallet/react/types';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface TransferContextType {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  transferInfo: TransferInformation;
  setTransactionData: (data: string) => void;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  execute: () => void;
}

export const TransferContext = createContext({} as TransferContextType);

type LNURLTransferProps = {
  data: string;
  amount: number;
  comment: string;
};

export function LNURLTransferProvider({ children }: { children: React.ReactNode }) {
  const [transfer, setTransfer] = useState<LNURLTransferProps>({
    data: '',
    amount: 0,
    comment: '',
  });

  const router = useRouter();

  const setTransactionData = (data: string) => {
    setTransfer({
      ...transfer,
      data,
    });
  };

  const setAmountToPay = (amount: number) => {
    setTransfer({
      ...transfer,
      amount,
    });
  };

  const setComment = (comment: string) => {
    setTransfer({
      ...transfer,
      comment: escapingBrackets(comment),
    });
  };

  const { isLoading, isSuccess, isError, transferInfo, execute } = useLNTransfer({
    data: transfer.data,
    amount: transfer.amount,
    comment: transfer.comment,
  });

  useEffect(() => {
    switch (transferInfo.type) {
      case false:
        return;

      case TransferTypes.LNURLW:
        if (!transferInfo.payRequest?.maxWithdrawable) return;
        router.push(`/transfer/summary?data=${transferInfo.data}`);
        break;

      case TransferTypes.INVOICE:
        if (transferInfo.amount > 0) router.push(`/transfer/summary?data=${transferInfo.data}`);
        break;

      default:
        !transferInfo.amount
          ? router.push(`/transfer/amount?data=${transferInfo.data}`)
          : router.push(`/transfer/summary?data=${transferInfo.data}`);
    }
  }, [transferInfo.type]);

  const value = {
    isLoading,
    isSuccess,
    isError,
    transferInfo,
    setTransactionData,
    setAmountToPay,
    setComment,
    execute,
  };

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
}

export const useTransferContext = () => {
  return useContext(TransferContext);
};
