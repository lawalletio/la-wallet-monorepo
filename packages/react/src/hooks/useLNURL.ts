import { requestInvoice } from '@lawallet/utils/actions';
import { TransferTypes, type ConfigParameter, type LNURLTransferType } from '@lawallet/utils/types';
import { useEffect, useState } from 'react';

import { escapingBrackets, claimLNURLw, formatLNURLData, defaultLNURLTransfer } from '@lawallet/utils';
import { useConfig } from './useConfig.js';
import { useNostrContext } from '../context/NostrContext.js';
import { useTransfer } from './useTransfer.js';
import type { StatusVarsTypes } from './useStatusVars.js';

export interface UseLNURLReturns extends StatusVarsTypes {
  transferInfo: LNURLTransferType;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  execute: () => void;
}

interface UseLNURLParameters extends ConfigParameter {
  data: string;
  amount?: number;
  comment?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useLNURL = (params: UseLNURLParameters): UseLNURLReturns => {
  const config = useConfig(params);
  const [transferInfo, setTransferInfo] = useState<LNURLTransferType>({
    ...defaultLNURLTransfer,
    data: params.data ?? defaultLNURLTransfer.data,
    amount: params.amount ?? defaultLNURLTransfer.amount,
    comment: params.comment ?? defaultLNURLTransfer.comment,
  });

  const {
    isLoading,
    isSuccess,
    isError,
    error,
    handleMarkSuccess,
    handleMarkError,
    handleMarkLoading,
    execInternalTransfer,
    execOutboundTransfer,
  } = useTransfer({ ...params, tokenName: 'BTC' });

  const { signer, signerInfo } = useNostrContext();

  const prepareTransaction = async (data: string) => {
    const formattedTransferInfo: LNURLTransferType = await formatLNURLData(data);

    switch (formattedTransferInfo.type) {
      case TransferTypes.NONE:
        return false;

      case TransferTypes.LNURLW:
        if (!formattedTransferInfo.request?.maxWithdrawable) return false;
        break;
    }

    setTransferInfo({
      ...formattedTransferInfo,
      amount: formattedTransferInfo.amount > 0 ? formattedTransferInfo.amount : transferInfo.amount,
      comment: formattedTransferInfo.comment ?? transferInfo.comment,
    });
    return true;
  };

  const setAmountToPay = (amount: number) => {
    setTransferInfo({
      ...transferInfo,
      amount,
    });
  };

  const setComment = (comment: string) => {
    setTransferInfo({
      ...transferInfo,
      comment: escapingBrackets(comment),
    });
  };

  const execute = async () => {
    if (isLoading || !signer || !signerInfo || !transferInfo.type) return;
    handleMarkLoading(true);

    try {
      if (transferInfo.type === TransferTypes.LNURLW) {
        const { callback, maxWithdrawable, k1 } = transferInfo.request!;

        claimLNURLw(signerInfo.npub, callback, k1!, maxWithdrawable!, config)
          .then((claimed) => {
            claimed ? handleMarkSuccess() : handleMarkError();
          })
          .catch(() => handleMarkError());
      } else if (transferInfo.type === TransferTypes.INTERNAL) {
        execInternalTransfer({
          pubkey: transferInfo.receiverPubkey,
          amount: transferInfo.amount,
          comment: transferInfo.comment,
        });
      } else {
        const bolt11: string = await requestInvoice(
          `${transferInfo.request?.callback}?amount=${
            transferInfo.amount * 1000
          }&comment=${escapingBrackets(transferInfo.comment)}`,
        );

        execOutboundTransfer({ bolt11, amount: transferInfo.amount });
      }
    } catch {
      handleMarkError();
    }
  };

  useEffect(() => {
    if (transferInfo.data) prepareTransaction(transferInfo.data);
  }, [transferInfo.data]);

  useEffect(() => {
    setTransferInfo((prev) => {
      return {
        ...prev,
        data: params.data ?? prev.data,
        amount: params.amount ?? prev.amount,
        comment: params.comment ?? prev.comment,
      };
    });
  }, [params.data, params.amount, params.comment]);

  return {
    error,
    isLoading,
    isSuccess,
    isError,
    transferInfo,
    setAmountToPay,
    setComment,
    execute,
  };
};
