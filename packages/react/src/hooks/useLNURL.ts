import { TransferTypes, type ConfigParameter, type LNURLTransferType } from '@lawallet/utils/types';
import { useEffect, useState } from 'react';

import { defaultLNURLTransfer, formatLNURLData, lnurl_decode } from '@lawallet/utils';
import { useConfig } from './useConfig.js';

interface UseLNURLParameters extends ConfigParameter {
  lnurlOrAddress: string;
}

type LNURLType = {
  lnurl: string;
  decoded_lnurl: string;
  transferInfo: LNURLTransferType;
};

export interface UseLNURLReturns {
  LNURLInfo: LNURLType;
  decodeLNURL: (data: string) => Promise<boolean>;
}

export const useLNURL = (params: UseLNURLParameters): UseLNURLReturns => {
  const config = useConfig(params);
  const [LNURLInfo, setLNURLInfo] = useState<LNURLType>({
    lnurl: '',
    decoded_lnurl: '',
    transferInfo: defaultLNURLTransfer,
  });

  const decodeLNURL = async (data: string): Promise<boolean> => {
    const lnurlTransferInfo: LNURLTransferType = await formatLNURLData(data, config);

    switch (lnurlTransferInfo.type) {
      case TransferTypes.NONE:
        return false;

      case TransferTypes.LNURLW:
        if (!lnurlTransferInfo.request?.maxWithdrawable) return false;
        break;
    }

    setLNURLInfo({
      ...LNURLInfo,
      decoded_lnurl: lnurl_decode(data),
      transferInfo: lnurlTransferInfo,
    });

    return true;
  };

  useEffect(() => {
    if (LNURLInfo.lnurl) decodeLNURL(LNURLInfo.lnurl);
  }, [LNURLInfo.lnurl]);

  return {
    LNURLInfo,
    decodeLNURL,
  };
};
