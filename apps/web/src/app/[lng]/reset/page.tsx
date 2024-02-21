'use client';
import Logo from '@/components/Logo';
import { Loader } from '@lawallet/ui';

import { LAWALLET_VERSION } from '@/constants/constants';
import { appTheme } from '@/config';
import { useTranslation } from '@/context/TranslateContext';
import useErrors from '@/hooks/useErrors';
import { buildCardActivationEvent, useConfig, useWalletContext } from '@lawallet/react';
import { cardResetCaim, generateUserIdentity } from '@lawallet/react/actions';
import { Container, Feedback, Flex, Heading, Text } from '@lawallet/ui';
import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const { t } = useTranslation();
  const {
    account: { identity },
  } = useWalletContext();

  const config = useConfig();
  const router = useRouter();
  const errors = useErrors();
  const params = useSearchParams();

  useEffect(() => {
    if (identity.data.hexpub.length) return;

    const recoveryNonce: string = params.get('n') || '';
    if (!recoveryNonce) {
      router.push('/');
      return;
    }

    generateUserIdentity().then((generatedIdentity) => {
      buildCardActivationEvent(recoveryNonce, generatedIdentity.privateKey, config)
        .then((cardEvent: NostrEvent) => {
          cardResetCaim(cardEvent, config).then((res) => {
            if (res.error) errors.modifyError(res.error);

            if (res.name) {
              identity
                .initializeCustomIdentity(generatedIdentity.privateKey, res.name)
                .then(() => router.push('/dashboard'));
            } else {
              errors.modifyError('ERROR_ON_RESET_ACCOUNT');
            }
          });
        })
        .catch(() => router.push('/'));
    });
  }, []);

  return (
    <Container size="medium">
      <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
        <Logo />
        <Text align="center" color={appTheme.colors.gray50}>
          {LAWALLET_VERSION}
        </Text>
      </Flex>

      <Flex direction="column" align="center" justify="center">
        <Heading as="h2">{t('RECOVERING_ACCOUNT')}</Heading>
      </Flex>

      <Flex flex={1} justify="center" align="center">
        <Loader />
      </Flex>

      <Flex flex={1} justify="center" align="center">
        <Feedback show={errors.errorInfo.visible} status={'error'}>
          {errors.errorInfo.text}
        </Feedback>
      </Flex>
    </Container>
  );
}
