import { useTranslation } from '@/context/TranslateContext';
import { extractFirstTwoChars } from '@/utils';
import { formatAddress, splitHandle, useConfig } from '@lawallet/react';
import { TransferTypes } from '@lawallet/react/types';
import { Avatar, Container, Flex, HeroCard, Text } from '@lawallet/ui';
import React from 'react';

const HeroCardWithData = ({ type, data }: { type: TransferTypes; data: string }) => {
  const { t } = useTranslation();
  const config = useConfig();
  const [transferUsername, transferDomain] = splitHandle(data, config);

  return (
    <HeroCard>
      <Container size="small">
        <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
          {type === TransferTypes.LNURLW ? (
            <Text size="small">{t('CLAIM_THIS_INVOICE')}</Text>
          ) : (
            <Avatar size="large">
              <Text size="small">{extractFirstTwoChars(transferUsername)}</Text>
            </Avatar>
          )}

          {type === TransferTypes.INVOICE || type === TransferTypes.LNURLW ? (
            <Flex justify="center">
              <Text>{formatAddress(data, 15)}</Text>
            </Flex>
          ) : (
            <Flex justify="center">
              <Text>
                {transferUsername}@{transferDomain}
              </Text>
            </Flex>
          )}
        </Flex>
      </Container>
    </HeroCard>
  );
};

export default HeroCardWithData;
