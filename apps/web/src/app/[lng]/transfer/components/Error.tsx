'use client';

import { Divider, Container, Flex, Heading, LinkButton, Text } from '@lawallet/ui';
import { useTranslation } from '@/context/TranslateContext';

export const ErrorTransfer = () => {
  const { t } = useTranslation();
  //   const { transferInfo } = useTransferContext();

  //   const router = useRouter();
  //   if (!transferInfo.data) router.push('/dashboard');

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
            <LinkButton variant="borderless" href="/dashboard">
              {t('GO_HOME')}
            </LinkButton>
          </Flex>
          <Divider y={32} />
        </Container>
      </Flex>
    </>
  );
};
