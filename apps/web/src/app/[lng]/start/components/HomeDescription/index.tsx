'use client';

import { useTranslation } from '@/context/TranslateContext';
import { Flex, Heading, Text } from '@lawallet/ui';

import { appTheme } from '../../../../../../config/themeConfig';
import { HomeDescription } from './style';

export default function Component() {
  const { t } = useTranslation();

  return (
    <HomeDescription>
      <Flex direction="column" align="center" gap={8}>
        <Text align="center">{t('CONFIGURE_CARD')}</Text>
        <Heading align="center" color={appTheme.colors.primary}>
          {t('CONFIGURE_CARD_SECONDS')}
        </Heading>
      </Flex>
    </HomeDescription>
  );
}
