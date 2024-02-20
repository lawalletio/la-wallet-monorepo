import { useTranslation } from '@/context/TranslateContext';
import { extractFirstTwoChars } from '@/utils';
import { formatAddress, splitHandle, useConfig } from '@lawallet/react';
import { TransferTypes } from '@lawallet/react/types';
import { Avatar, Card, Text } from '@lawallet/ui';

const CardWithData = ({ type, data }: { type: TransferTypes; data: string }) => {
  const { t } = useTranslation();
  const config = useConfig();
  const [transferUsername, transferDomain] = splitHandle(data, config);

  return (
    <Card>
      {type === TransferTypes.LNURLW ? (
        <Text size="small">{t('CLAIM_THIS_INVOICE')}</Text>
      ) : (
        <Avatar size="large">
          <Text size="small">{extractFirstTwoChars(transferUsername)}</Text>
        </Avatar>
      )}
      {type === TransferTypes.INVOICE || type === TransferTypes.LNURLW ? (
        <Text>{formatAddress(data, 15)}</Text>
      ) : (
        <Text>
          {transferUsername}@{transferDomain}
        </Text>
      )}
    </Card>
  );
};

export default CardWithData;
