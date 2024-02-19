'use client';

import { Divider, Container, Flex, Heading, LinkButton, Text } from '@lawallet/ui';
import { useTranslation } from '@/context/TranslateContext';
import { useRouter } from 'next/navigation';

export const ErrorTransfer = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Container size="small">
        <Divider y={16} />
        <Heading>Error</Heading>
        <Divider y={4} />
        <Text size="small">{t('DETAIL_FAILED_TRANSACTION')}</Text>
      </Container>

      <Flex>
        <Container size="small">
          <Divider y={16} />
          <Flex gap={8}>
            <LinkButton variant="borderless" onClick={() => router.push('/dashboard')}>
              {t('GO_HOME')}
            </LinkButton>
          </Flex>
          <Divider y={32} />
        </Container>
      </Flex>
    </>
  );
};
