'use client';
import { Container, Divider, Flex, Text, Button, Feedback, theme } from '@lawallet/ui';
import { CardAlert } from '@/components/UI';
import Logo from '@/components/Logo';
import HomeDescription from '@/app/[lng]/start/components/HomeDescription';

import { useEffect, useState } from 'react';
import { checkIOS } from '@/utils';
import { useTranslation } from '@/context/TranslateContext';
import { Loader } from '@/components/Loader/Loader';
import { LAWALLET_VERSION } from '@/constants/constants';
import { useRouter } from 'next/navigation';

const StartView = ({ onClick, verifyingNonce, isValidNonce }) => {
  const { t } = useTranslation();
  const [isIOS, setIsIOS] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    if (isValidNonce) setIsIOS(checkIOS(navigator));
  }, [isValidNonce]);

  return (
    <Container size="small">
      <Divider y={16} />
      <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
        <Logo />
        <Text align="center" color={theme.colors.gray50}>
          {LAWALLET_VERSION}
        </Text>
      </Flex>

      <Flex direction="column">
        {verifyingNonce ? (
          <Loader />
        ) : isValidNonce ? (
          <>
            <HomeDescription />
            <Divider y={16} />

            {isIOS && (
              <>
                <CardAlert
                  title={t('RECOMMEND_SAFARI_TITLE')}
                  description={
                    <>
                      <strong>{t('RECOMMEND_SAFARI')}</strong> {t('RECOMMEND_SAFARI_REASON')}
                    </>
                  }
                />
                <Divider y={16} />
              </>
            )}

            <Flex>
              <Button onClick={onClick}>{t('START')}</Button>
            </Flex>
          </>
        ) : (
          <>
            <Flex align="center" justify="center">
              <Feedback show={true} status={'error'}>
                {t('INVALID_NONCE')}
              </Feedback>
            </Flex>

            <Divider y={16} />

            <Flex>
              <Button onClick={() => router.push('/')}>{t('BACK_TO_HOME')}</Button>
            </Flex>
          </>
        )}
      </Flex>
      <Divider y={32} />
    </Container>
  );
};

export default StartView;
