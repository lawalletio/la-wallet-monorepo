import { useConfig, useLNURL } from '@lawallet/react';
import { LNURLTransferType } from '@lawallet/react/types';
import { useSearchParams } from 'next/navigation';
import { createContext, useContext } from 'react';

interface ILNURLContext {
  LNURLInfo: LNURLTransferType;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  execute: () => void;
}

const LNURLContext = createContext({} as ILNURLContext);

export function LNURLProvider({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const config = useConfig();

  const { isLoading, isError, isSuccess, LNURLInfo, setAmountToPay, setComment, execute } = useLNURL({
    lnurlOrAddress: params.get('data') ?? '',
    amount: Number(params.get('amount')) ?? 0,
    comment: params.get('comment') ?? '',
    config,
  });

  const value = {
    LNURLInfo,
    isLoading,
    isError,
    isSuccess,
    setAmountToPay,
    setComment,
    execute,
  };

  return <LNURLContext.Provider value={value}>{children}</LNURLContext.Provider>;
}

export const useLNURLContext = () => {
  const context = useContext(LNURLContext);
  if (!context) {
    throw new Error('useLNURLContext must be used within LNURLContext');
  }

  return context;
};
