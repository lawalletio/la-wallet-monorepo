import type { NDKEvent, NDKKind, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import {
  LaWalletKinds,
  LaWalletTags,
  buildTxStartEvent,
  getTagValue,
  useConfig,
  useNostrContext,
} from '../exports/index.js';
import { useSubscription } from './useSubscription.js';
import * as React from 'react';
import { useStatusVars, type UseStatusVarsReturns } from './useStatusVars.js';
import { broadcastEvent } from '../exports/actions.js';
import type { ConfigParameter } from '../exports/types.js';

type OutboundTransferParameters = { amount: number; tags: NDKTag[] };
type InternalTransferParameters = {
  receiverPubkey: string;
  amount: number;
  comment: string;
  tags?: NDKTag[];
};

interface UseTransferReturns extends UseStatusVarsReturns {
  isPending: boolean;
  execInternalTransfer: (params: InternalTransferParameters) => Promise<boolean>;
  execOutboundTransfer: (params: OutboundTransferParameters) => Promise<boolean>;
}

interface UseTransferParameters extends ConfigParameter {
  tokenName: string;
  onSuccess?: () => void;
  onError?: (message?: string) => void;
}

export const useTransfer = (params: UseTransferParameters): UseTransferReturns => {
  const { tokenName } = params;
  const config = useConfig(params);
  const statusVars = useStatusVars(params);

  const [startEvent, setStartEvent] = React.useState<NostrEvent | null>(null);
  const { ndk, signer, signerInfo, signEvent } = useNostrContext({ config });

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
    config,
  });

  const publishTransfer = (event: NostrEvent): Promise<boolean> => {
    return broadcastEvent(event, config).then((published) => {
      if (!published) statusVars.handleMarkError();

      setStartEvent(event);
      statusVars.handleMarkLoading(false);

      return published;
    });
  };

  const execInternalTransfer = async (transferParameters: InternalTransferParameters): Promise<boolean> => {
    const { receiverPubkey, amount, tags = [], comment = '' } = transferParameters;
    if (!signerInfo || !receiverPubkey || !amount) return false;

    statusVars.handleMarkLoading(true);

    const txEvent: NostrEvent | undefined = await signEvent(
      buildTxStartEvent(
        {
          tokenName,
          amount,
          senderPubkey: signerInfo.pubkey,
          comment,
          tags: [['p', receiverPubkey], ...tags],
        },
        config,
      ),
    );

    return txEvent ? publishTransfer(txEvent) : false;
  };

  const execOutboundTransfer = async (params: OutboundTransferParameters): Promise<boolean> => {
    const { tags = [], amount } = params;
    if (!signer || !signerInfo || !amount) return false;

    statusVars.handleMarkLoading(true);

    const txEvent: NostrEvent | undefined = await signEvent(
      buildTxStartEvent(
        {
          tokenName,
          amount,
          senderPubkey: signerInfo.pubkey,
          tags: [['p', config.modulePubkeys.urlx], ...tags],
        },
        config,
      ),
    );

    return txEvent ? publishTransfer(txEvent) : false;
  };

  const processStatusTransfer = async (ledgerEvent: NDKEvent) => {
    if (startEvent) {
      const subkind: string | undefined = getTagValue(ledgerEvent.tags, 't');
      if (subkind) {
        if (subkind.includes('error')) statusVars.handleMarkError();

        if (subkind.includes('ok')) {
          const refundEvent = await ndk.fetchEvent({
            kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
            authors: [config.modulePubkeys.urlx],
            '#t': [LaWalletTags.INTERNAL_TRANSACTION_START],
            '#e': [startEvent.id!],
          });

          refundEvent ? statusVars.handleMarkError() : statusVars.handleMarkSuccess();
        }

        setStartEvent(null);
      }
    }
  };

  React.useEffect(() => {
    if (events.length) processStatusTransfer(events[0]!);
  }, [events]);

  return {
    ...statusVars,
    isPending: Boolean(startEvent),
    execInternalTransfer,
    execOutboundTransfer,
  };
};
