import { Container, Flex, Text, theme } from '@lawallet/ui';
import { useTranslation } from '@/context/TranslateContext';
import EmptySvg from './EmptySvg';

const EmptyCards = () => {
  const { t } = useTranslation();

  return (
    <Container size="medium">
      <Flex flex={1} direction="column" align="center" justify="center" gap={16}>
        <EmptySvg />
        <Flex direction="column" gap={4} align="center">
          <Text isBold={true}>{t('NO_HAVE_CARDS')}</Text>
          <Text size="small" color={theme.colors.gray50}>
            {t('NOT_FOUND_CARD')}
          </Text>
        </Flex>
      </Flex>
    </Container>
  );
};

export default EmptyCards;
