import { type TransferInformation, broadcastEvent, requestInvoice } from '@lawallet/utils/actions';
import { TransferTypes, type ConfigParameter } from '@lawallet/utils/types';
import { NDKEvent, NDKKind, type NostrEvent } from '@nostr-dev-kit/ndk';
import { useEffect, useState } from 'react';

import {
  escapingBrackets,
  LaWalletKinds,
  LaWalletTags,
  SignEvent,
  buildTxStartEvent,
  claimLNURLw,
  formatTransferData,
  getTag,
  defaultTransfer,
} from '@lawallet/utils';
import { useConfig } from './useConfig.js';
import { useNostrContext } from '../context/NostrContext.js';
import { useSubscription } from './useSubscription.js';

export interface UseLNTransferReturns {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  transferInfo: TransferInformation;
  execute: () => void;
}

interface UseLNTransferParameters extends ConfigParameter {
  data: string;
  amount?: number;
  comment?: string;
}

const tokenName = 'BTC';

export const useLNTransfer = (params: UseLNTransferParameters): UseLNTransferReturns => {
  const config = useConfig(params);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const [startEvent, setStartEvent] = useState<NostrEvent | null>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInformation>(defaultTransfer);

  const { ndk, signer, signerInfo } = useNostrContext();

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since: startEvent ? startEvent.created_at - 60000 : undefined,
        '#e': startEvent?.id ? [startEvent.id] : [],
      },
    ],
    options: {
      groupable: false,
      groupableDelay: 0,
    },
    enabled: Boolean(startEvent?.id),
  });

  const prepareTransaction = async (data: string) => {
    const formattedTransferInfo: TransferInformation = await formatTransferData(data);

    switch (formattedTransferInfo.type) {
      case false:
        return false;

      case TransferTypes.LNURLW:
        if (!formattedTransferInfo.payRequest?.maxWithdrawable) return false;
        break;
    }

    setTransferInfo(formattedTransferInfo);
    return true;
  };

  const handleError = () => {
    if (isSuccess) setIsSuccess(false);
    if (!isError) setIsError(true);

    if (isLoading) setIsLoading(false);
  };

  const handleSuccess = () => {
    if (isError) setIsError(false);
    if (!isSuccess) setIsSuccess(true);

    if (isLoading) setIsLoading(false);
  };

  const publishTransfer = (event: NostrEvent) => {
    setStartEvent(event);
    broadcastEvent(event, config).then((published) => {
      if (!published) handleError();
    });
  };

  const execInternalTransfer = async (info: TransferInformation) => {
    if (!signer || !signerInfo) return;

    const { amount, receiverPubkey, comment } = info;

    const txEvent: NostrEvent | undefined = await SignEvent(
      signer,
      buildTxStartEvent({
        tokenName,
        amount,
        senderPubkey: signerInfo.pubkey,
        receiverPubkey,
        comment,
      }),
    );
    if (txEvent) publishTransfer(txEvent);
  };

  const execOutboundTransfer = async (info: TransferInformation) => {
    if (!signer || !signerInfo) return;

    const { data, amount, payRequest, comment } = info;
    const bolt11: string = transferInfo.payRequest
      ? await requestInvoice(`${payRequest?.callback}?amount=${amount * 1000}&comment=${escapingBrackets(comment)}`)
      : data;

    const txEvent: NostrEvent | undefined = await SignEvent(
      signer,
      buildTxStartEvent({
        tokenName,
        amount,
        senderPubkey: signerInfo.pubkey,
        bolt11,
      }),
    );

    if (txEvent) publishTransfer(txEvent);
  };

  const execute = () => {
    if (isLoading || !signer || !signerInfo || !transferInfo.type || transferInfo.expired) return;
    setIsLoading(true);

    try {
      if (transferInfo.type === TransferTypes.LNURLW) {
        claimLNURLw(transferInfo.payRequest, signerInfo.npub, config).then((claimed) => {
          claimed ? handleSuccess() : handleError();
        });
      } else if (transferInfo.type === TransferTypes.INTERNAL) {
        execInternalTransfer(transferInfo);
      } else {
        execOutboundTransfer(transferInfo);
      }
    } catch {
      handleError();
    }
  };

  const processStatusTransfer = async (ledgerEvent: NDKEvent) => {
    if (startEvent) {
      const subkind: string | undefined = getTag(ledgerEvent.tags, 't');
      if (subkind) {
        if (subkind.includes('error')) handleError();

        if (subkind.includes('ok')) {
          const refundEvent = await ndk.fetchEvent({
            kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
            authors: [config.modulePubkeys.urlx],
            '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
            '#e': [startEvent.id!],
          });

          refundEvent ? handleError() : handleSuccess();
        }
      }
    }
  };

  useEffect(() => {
    if (events.length) processStatusTransfer(events[0]!);
  }, [events]);

  useEffect(() => {
    if (params.data) prepareTransaction(params.data);
  }, [params.data]);

  useEffect(() => {
    setTransferInfo((prev) => {
      return {
        ...prev,
        amount: params.amount ?? prev.amount,
        comment: params.comment ?? prev.comment,
      };
    });
  }, [params.amount, params.comment]);

  return {
    isLoading,
    isSuccess,
    isError,
    transferInfo,
    execute,
  };
};
