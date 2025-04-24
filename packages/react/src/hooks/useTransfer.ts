import type { NDKEvent, NDKKind, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';
import { useSubscription } from './useSubscription.js';
import * as React from 'react';
import { useStatusVars, type UseStatusVarsReturns } from './useStatusVars.js';
import { broadcastEvent } from '@lawallet/utils/actions';
import type { ConfigParameter } from '@lawallet/utils/types';
import { useNostr } from '../context/NostrContext.js';
import { useConfig } from './useConfig.js';
import { LaWalletKinds, buildTxStartEvent, getTagValue } from '@lawallet/utils';
import { TransactionTags } from '@lawallet/utils';

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

type StartEventInfo = {
  published: boolean;
  event?: NostrEvent;
  type?: 'internal' | 'external';
};

export const useTransfer = (params: UseTransferParameters): UseTransferReturns => {
  const { tokenName } = params;
  const config = useConfig(params);
  const statusVars = useStatusVars(params);

  const { ndk, validateRelaysStatus, signer, signerInfo, signEvent } = useNostr({ config });
  const [startEventInfo, setStartEventInfo] = React.useState<StartEventInfo>({ published: false });

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
        since: startEventInfo.event ? startEventInfo.event.created_at - 60000 : undefined,
        '#e': startEventInfo.event?.id ? [startEventInfo.event.id] : [],
      },
    ],
    options: {
      groupable: false,
    },
    enabled: startEventInfo.published,
    config,
  });

  const publishTransfer = (event: NostrEvent, txType: 'internal' | 'external'): Promise<boolean> => {
    return broadcastEvent(event, config).then((published) => {
      if (!published) statusVars.handleMarkError();

      setStartEventInfo({
        event,
        type: txType,
        published,
      });
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

    return txEvent ? publishTransfer(txEvent, 'internal') : false;
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

    return txEvent ? publishTransfer(txEvent, 'external') : false;
  };

  const handleInternalStatus = async (event: NDKEvent) => {
    const subkind: string | undefined = getTagValue(event.tags, 't');

    switch (subkind) {
      case 'internal-transaction-error':
        statusVars.handleMarkError();
        break;

      case 'internal-transaction-ok': {
        const refundEvent = await ndk.fetchEvent({
          kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
          authors: [config.modulePubkeys.urlx],
          '#t': [TransactionTags.INTERNAL.start],
          '#e': [event.id],
        });

        refundEvent ? statusVars.handleMarkError() : statusVars.handleMarkSuccess();
        break;
      }
    }

    setStartEventInfo({ published: false });
  };

  const handleExternalStatus = async (events: NDKEvent[]) => {
    for (const event of events) {
      const subkind: string | undefined = getTagValue(event.tags, 't');
      let shouldResetStartEvent = false;

      switch (subkind) {
        case TransactionTags.INTERNAL.error:
          statusVars.handleMarkError();
          shouldResetStartEvent = true;
          break;

        case TransactionTags.OUTBOUND.error:
        case TransactionTags.INTERNAL.error: {
          const refundEvent = await ndk.fetchEvent({
            kinds: [LaWalletKinds.REGULAR as unknown as NDKKind],
            authors: [config.modulePubkeys.urlx],
            '#t': [TransactionTags.INTERNAL.start],
            '#e': [event.id],
          });

          if (refundEvent) statusVars.handleMarkError();
          shouldResetStartEvent = true;
          break;
        }

        case TransactionTags.OUTBOUND.ok:
          statusVars.handleMarkSuccess();
          shouldResetStartEvent = true;
          break;
      }

      if (shouldResetStartEvent) setStartEventInfo((prev) => ({ ...prev, published: false }));
    }
  };

  const processStatusTransfer = async (statusEvents: NDKEvent[]) => {
    if (startEventInfo.published) {
      if (startEventInfo.type === 'internal') {
        handleInternalStatus(statusEvents[0]!);
        return;
      }

      handleExternalStatus(statusEvents);
    }
  };

  React.useEffect(() => {
    if (events.length) processStatusTransfer(events);
  }, [events]);

  React.useEffect(() => {
    if (startEventInfo.published) validateRelaysStatus();
  }, [startEventInfo.published])

  return {
    ...statusVars,
    isPending: startEventInfo.published,
    execInternalTransfer,
    execOutboundTransfer,
  };
};
