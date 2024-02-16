import { requestInvoice } from '@lawallet/utils/actions';
import { TransferTypes, type ConfigParameter, type LNURLTransferType } from '@lawallet/utils/types';
import { useEffect, useState } from 'react';

import { escapingBrackets, claimLNURLw, formatLNURLData, defaultLNURLTransfer } from '@lawallet/utils';
import { useConfig } from './useConfig.js';
import { useNostrContext } from '../context/NostrContext.js';
import { useTransfer } from './useTransfer.js';
import type { StatusVarsTypes } from './useStatusVars.js';

export interface UseLNURLReturns extends StatusVarsTypes {
  LNURLInfo: LNURLTransferType;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  execute: () => void;
}

interface UseLNURLParameters extends ConfigParameter {
  lnurlOrAddress: string;
  amount?: number;
  comment?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export const useLNURL = (params: UseLNURLParameters): UseLNURLReturns => {
  const config = useConfig(params);
  const [LNURLInfo, setLNURLInfo] = useState<LNURLTransferType>({
    ...defaultLNURLTransfer,
    data: params.lnurlOrAddress ?? defaultLNURLTransfer.data,
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

  const { signer, signerInfo } = useNostrContext({ config });

  const prepareTransaction = async (data: string) => {
    const formattedTransferInfo: LNURLTransferType = await formatLNURLData(data, config);

    switch (formattedTransferInfo.type) {
      case TransferTypes.NONE:
        return false;

      case TransferTypes.LNURLW:
        if (!formattedTransferInfo.request?.maxWithdrawable) return false;
        break;
    }

    setLNURLInfo({
      ...formattedTransferInfo,
      amount: formattedTransferInfo.amount > 0 ? formattedTransferInfo.amount : LNURLInfo.amount,
      comment: formattedTransferInfo.comment ?? LNURLInfo.comment,
    });
    return true;
  };

  const setAmountToPay = (amount: number) => {
    setLNURLInfo({
      ...LNURLInfo,
      amount,
    });
  };

  const setComment = (comment: string) => {
    setLNURLInfo({
      ...LNURLInfo,
      comment: escapingBrackets(comment),
    });
  };

  const execute = async () => {
    if (isLoading || !signer || !signerInfo || LNURLInfo.type === TransferTypes.NONE) return;
    handleMarkLoading(true);

    try {
      if (LNURLInfo.type === TransferTypes.LNURLW) {
        const { callback, maxWithdrawable, k1 } = LNURLInfo.request!;
        claimLNURLw(signerInfo.npub, callback, k1!, maxWithdrawable!, config)
          .then((claimed) => {
            claimed ? handleMarkSuccess() : handleMarkError();
          })
          .catch(() => handleMarkError());
      } else if (LNURLInfo.type === TransferTypes.INTERNAL) {
        execInternalTransfer({
          pubkey: LNURLInfo.receiverPubkey,
          amount: LNURLInfo.amount,
          comment: LNURLInfo.comment,
        });
      } else {
        const { callback } = LNURLInfo.request!;
        const bolt11: string = await requestInvoice(
          `${callback}?amount=${LNURLInfo.amount * 1000}&comment=${escapingBrackets(LNURLInfo.comment)}`,
        );

        execOutboundTransfer({ tags: [['bolt11', bolt11]], amount: LNURLInfo.amount });
      }
    } catch (err) {
      handleMarkError((err as Error).message);
    }
  };

  useEffect(() => {
    if (LNURLInfo.data) prepareTransaction(LNURLInfo.data);
  }, [LNURLInfo.data]);

  useEffect(() => {
    setLNURLInfo((prev) => {
      return {
        ...prev,
        data: params.lnurlOrAddress ?? prev.data,
        amount: params.amount ?? prev.amount,
        comment: params.comment ?? prev.comment,
      };
    });
  }, [params.lnurlOrAddress, params.amount, params.comment]);

  return {
    error,
    isLoading,
    isSuccess,
    isError,
    LNURLInfo,
    setAmountToPay,
    setComment,
    execute,
  };
};
