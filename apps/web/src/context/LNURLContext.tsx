import {
  claimLNURLw,
  defaultLNURLTransfer,
  escapingBrackets,
  useConfig,
  useLNURL,
  useNostrContext,
  useTransfer,
  useWalletContext,
} from '@lawallet/react';
import { requestInvoice } from '@lawallet/react/actions';
import { LNURLTransferType, TransferTypes } from '@lawallet/react/types';
import { NDKTag } from '@nostr-dev-kit/ndk';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface ILNURLContext {
  LNURLTransferInfo: LNURLTransferType;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  execute: () => void;
}

const LNURLContext = createContext({} as ILNURLContext);

export function LNURLProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const config = useConfig();

  const [LNURLTransferInfo, setLNURLTransferInfo] = useState<LNURLTransferType>(defaultLNURLTransfer);

  const { LNURLInfo, decodeLNURL } = useLNURL({ lnurlOrAddress: LNURLTransferInfo.data, config });
  const {
    account: { identity },
  } = useWalletContext();
  const { signerInfo, signer, encrypt } = useNostrContext();

  const {
    isLoading,
    isSuccess,
    isError,
    handleMarkSuccess,
    handleMarkError,
    handleMarkLoading,
    execInternalTransfer,
    execOutboundTransfer,
  } = useTransfer({ ...params, tokenName: 'BTC' });

  const setAmountToPay = (amount: number) => {
    setLNURLTransferInfo({
      ...LNURLTransferInfo,
      amount,
    });
  };

  const setComment = (comment: string) => {
    setLNURLTransferInfo({
      ...LNURLTransferInfo,
      comment: escapingBrackets(comment),
    });
  };

  const defineMetadata = async (receiver: string): Promise<NDKTag> => {
    const showReceiver: boolean = Boolean(receiver.length && !receiver.toLowerCase().startsWith('lnurl'));
    const showSender: boolean = Boolean(identity.data.username.length);

    const metadataMessage: { sender?: string; receiver?: string } = {
      ...(showReceiver ? { receiver: LNURLInfo.transferInfo.data } : {}),
      ...(showSender ? { sender: `${identity.data.username}@${config.federation.domain}` } : {}),
    };

    const metadataEncrypted: string = await encrypt(LNURLTransferInfo.receiverPubkey, JSON.stringify(metadataMessage));

    const metadataTag: NDKTag = ['metadata', 'true', 'nip04', metadataEncrypted];
    return metadataTag;
  };

  const execute = async () => {
    if (isLoading || !signer || !signerInfo || LNURLTransferInfo.type === TransferTypes.NONE) return;
    handleMarkLoading(true);

    const { type, request, receiverPubkey, data, amount, comment } = LNURLTransferInfo;

    try {
      if (type === TransferTypes.LNURLW) {
        const { callback, maxWithdrawable, k1 } = request!;
        const claimed: boolean = await claimLNURLw(signerInfo.npub, callback, k1!, maxWithdrawable!, config);

        claimed ? handleMarkSuccess() : handleMarkError();
      } else {
        const metadataTag: NDKTag = await defineMetadata(data);

        if (type === TransferTypes.INTERNAL) {
          execInternalTransfer({
            receiverPubkey: receiverPubkey,
            amount: amount,
            comment: comment,
            tags: [metadataTag],
          });
        } else {
          const { callback } = request!;
          const bolt11: string = await requestInvoice(
            `${callback}?amount=${amount * 1000}&comment=${escapingBrackets(comment)}`,
          );

          execOutboundTransfer({ tags: [['bolt11', bolt11], metadataTag], amount: amount });
        }
      }
    } catch (err) {
      handleMarkError((err as Error).message);
    }
  };

  const loadLNURLParam = async () => {
    const dataParam: string = params.get('data') ?? '';
    if (!dataParam) return;

    const decoded: boolean = await decodeLNURL(dataParam);
    if (!decoded) router.push('/transfer');
  };

  useEffect(() => {
    const { transferInfo } = LNURLInfo;
    if (transferInfo.type !== TransferTypes.NONE) {
      const amountParam: number = Number(params.get('amount'));

      const new_info: LNURLTransferType = {
        ...transferInfo,
        ...(amountParam && amountParam !== transferInfo.amount ? { amount: amountParam } : {}),
      };

      setLNURLTransferInfo(new_info);
    }
  }, [LNURLInfo]);

  useEffect(() => {
    loadLNURLParam();
  }, []);

  const value = {
    LNURLTransferInfo,
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
    throw new Error('useLNURLContext must be used within LNURLProvider');
  }

  return context;
};
