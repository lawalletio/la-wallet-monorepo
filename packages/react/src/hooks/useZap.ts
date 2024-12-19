import { buildZapRequestEvent, escapingBrackets } from '@lawallet/utils';
import { requestInvoice } from '@lawallet/utils/actions';
import { type NDKTag, type NostrEvent } from '@nostr-dev-kit/ndk';
import React from 'react';
import type { ConfigParameter } from '@lawallet/utils/types';
import { useConfig } from './useConfig.js';
import { useSubscription } from './useSubscription.js';
import { nip19 } from 'nostr-tools';
import { useNostr } from '../context/NostrContext.js';

type InvoiceProps = {
  bolt11: string;
  created_at: number;
  loading: boolean;
  payed: boolean;
};

const defaultDeposit: InvoiceProps = {
  bolt11: '',
  created_at: 0,
  loading: false,
  payed: false,
};

export interface useZapReturns {
  invoice: InvoiceProps;
  createZapInvoice: (sats: number, comment?: string, extraTags?: NDKTag[]) => Promise<string | undefined>;
  resetInvoice: () => void;
}

interface UseZapParameters extends ConfigParameter {
  receiverPubkey: string;
}

export const useZap = (parameters: UseZapParameters): useZapReturns => {
  const config = useConfig(parameters);
  const { signEvent, signerInfo } = useNostr({ config });

  const [invoice, setInvoice] = React.useState<InvoiceProps>(defaultDeposit);

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [9735],
        since: invoice.created_at,
      },
    ],
    options: { groupable: false },
    enabled: Boolean(invoice.bolt11.length && !invoice.payed),
    config,
  });

  const createZapInvoice = async (
    sats: number,
    comment?: string,
    extraTags: NDKTag[] = [],
  ): Promise<string | undefined> => {
    if (!signerInfo) return;
    setInvoice({ ...invoice, loading: true });

    try {
      const invoice_mSats: number = sats * 1000;
      const zapRequestEvent: NostrEvent | undefined = await signEvent(
        buildZapRequestEvent(signerInfo.pubkey, parameters.receiverPubkey, invoice_mSats, config, extraTags),
      );

      const zapRequestURI: string = encodeURI(JSON.stringify(zapRequestEvent));

      const bolt11 = await requestInvoice(
        `${config.endpoints.gateway}/lnurlp/${nip19.npubEncode(parameters.receiverPubkey)}/callback?amount=${invoice_mSats}&nostr=${zapRequestURI}${comment ? `&comment=${escapingBrackets(comment)}` : ''}`,
        config,
      );

      if (!bolt11) return undefined;

      setInvoice({
        bolt11,
        created_at: Math.round(Date.now() / 1000),
        loading: false,
        payed: false,
      });

      return bolt11;
    } catch {
      setInvoice({ ...invoice, loading: false });
      return undefined;
    }
  };

  const resetInvoice = () => {
    setInvoice(defaultDeposit);
  };

  React.useEffect(() => {
    if (events.length) {
      events.map((event) => {
        const boltTag = event.getMatchingTags('bolt11')[0]?.[1];
        if (boltTag === invoice.bolt11)
          setInvoice((prev) => {
            return { ...prev, payed: true };
          });
      });
    }
  }, [events.length]);

  return {
    invoice,
    createZapInvoice,
    resetInvoice,
  };
};
