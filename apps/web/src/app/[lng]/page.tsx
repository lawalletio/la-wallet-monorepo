'use client';

import Logo from '@/components/Logo';
import { Button, Divider, Container, Flex, Text } from '@lawallet/ui';
import { LAWALLET_VERSION } from '@/constants/constants';
import { useTranslation } from '@/context/TranslateContext';

import { useRouter } from 'next/navigation';
import { appTheme } from '../../../config/themeConfig';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();

  // const { handleCreateIdentity, loading } = useCreateIdentity()
  return (
    <Container size="small">
      <Divider y={16} />
      <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
        <Logo />
        <Text align="center" color={appTheme.colors.gray50}>
          {LAWALLET_VERSION}
        </Text>
      </Flex>

      <Flex direction="column">
        {/* <Divider y={16} />

        <Flex>
          <Button
            onClick={() =>
              handleCreateIdentity({ name: '', card: '', nonce: '' })
            }
            loading={loading}
          >
            {t('CREATE_ACCOUNT')}
          </Button>
        </Flex> */}

        <Divider y={16} />

        <Flex>
          <Button onClick={() => router.push('/login')}>{t('LOGIN_ACCOUNT')}</Button>
        </Flex>
      </Flex>
      <Divider y={32} />
    </Container>
  );
}
