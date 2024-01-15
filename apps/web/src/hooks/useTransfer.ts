import { escapingBrackets } from '@/utils';
import { useConfig, useNostrContext, useSigner, useSubscription, useWalletContext } from '@lawallet/react';
import { TransferInformation, broadcastEvent, defaultTransfer, requestInvoice } from '@lawallet/react/actions';
import { TransferTypes } from '@lawallet/react/types';
import {
  LaWalletKinds,
  LaWalletTags,
  SignEvent,
  buildTxStartEvent,
  claimLNURLw,
  formatTransferData,
  getTag,
} from '@lawallet/react/utils';
import { NDKEvent, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPublicKey, nip19 } from 'nostr-tools';
import { useEffect, useState } from 'react';

export interface TransferContextType {
  loading: boolean;
  transferInfo: TransferInformation;
  prepareTransaction: (data: string) => Promise<boolean>;
  setAmountToPay: (amount: number) => void;
  setComment: (comment: string) => void;
  executeTransfer: (privateKey: string) => void;
}

interface TransferProps {
  tokenName: string;
}

const useTransfer = ({ tokenName }: TransferProps): TransferContextType => {
  const config = useConfig();
  const [loading, setLoading] = useState<boolean>(false);
  const [startEvent, setStartEvent] = useState<NostrEvent | null>(null);
  const [transferInfo, setTransferInfo] = useState<TransferInformation>(defaultTransfer);

  const { ndk } = useNostrContext();
  const {
    user: { identity },
  } = useWalletContext();

  const { signer } = useSigner();
  const router = useRouter();
  const params = useSearchParams();

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
        router.push(`/transfer/summary?data=${formattedTransferInfo.data}`);
        break;

      case TransferTypes.INVOICE:
        if (formattedTransferInfo.amount > 0) router.push(`/transfer/summary?data=${formattedTransferInfo.data}`);
        break;

      default:
        !formattedTransferInfo.amount
          ? router.push(`/transfer/amount?data=${formattedTransferInfo.data}`)
          : router.push(`/transfer/summary?data=${formattedTransferInfo.data}`);
    }

    setTransferInfo(formattedTransferInfo);
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

  const publishTransfer = (event: NostrEvent) => {
    setStartEvent(event);
    broadcastEvent(event, config).then((published) => {
      if (!published) router.push('/transfer/error');
    });
  };

  const execInternalTransfer = async (info: TransferInformation) => {
    const { amount, receiverPubkey, comment } = info;

    const txEvent: NostrEvent | undefined = await SignEvent(
      signer!,
      buildTxStartEvent({
        tokenName,
        amount,
        senderPubkey: identity.hexpub,
        receiverPubkey,
        comment,
      }),
    );
    if (txEvent) publishTransfer(txEvent);
  };

  const execOutboundTransfer = async (info: TransferInformation) => {
    const { data, amount, payRequest, comment } = info;
    const bolt11: string = transferInfo.payRequest
      ? await requestInvoice(`${payRequest?.callback}?amount=${amount * 1000}&comment=${escapingBrackets(comment)}`)
      : data;

    const txEvent: NostrEvent | undefined = await SignEvent(
      signer!,
      buildTxStartEvent({
        tokenName,
        amount,
        senderPubkey: identity.hexpub,
        bolt11,
      }),
    );

    if (txEvent) publishTransfer(txEvent);
  };

  const executeTransfer = (privateKey: string) => {
    if (loading || !transferInfo.type || transferInfo.expired) return;
    setLoading(true);

    try {
      if (transferInfo.type === TransferTypes.LNURLW) {
        const npubKey = nip19.npubEncode(getPublicKey(privateKey));
        claimLNURLw(transferInfo.payRequest, npubKey, config).then((claimed) => {
          claimed ? router.push('/transfer/finish') : router.push('/transfer/error');
        });
      } else if (transferInfo.type === TransferTypes.INTERNAL) {
        execInternalTransfer(transferInfo);
      } else {
        execOutboundTransfer(transferInfo);
      }
    } catch {
      router.push('/transfer/error');
    }
  };

  const processStatusTransfer = async (ledgerEvent: NDKEvent) => {
    if (startEvent) {
      const subkind: string | undefined = getTag(ledgerEvent.tags, 't');
      if (subkind) {
        if (subkind.includes('error')) router.push('/transfer/error');

        if (subkind.includes('ok')) {
          const refundEvent = await ndk.fetchEvent({
            kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
            authors: [config.modulePubkeys.urlx],
            '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
            '#e': [startEvent.id!],
          });

          refundEvent ? router.push('/transfer/error') : router.push('/transfer/finish');
        }
      }
    }
  };

  useEffect(() => {
    if (events.length) processStatusTransfer(events[0]);
  }, [events]);

  useEffect(() => {
    const data: string = params.get('data') ?? '';
    if (!data) return;

    prepareTransaction(data);
  }, []);

  return {
    loading,
    transferInfo,
    prepareTransaction,
    setAmountToPay,
    setComment,
    executeTransfer,
  };
};

export default useTransfer;
