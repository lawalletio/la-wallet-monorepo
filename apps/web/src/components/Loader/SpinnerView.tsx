import React from 'react';
import Logo from '@/components/Logo';
import Container from '@/components/Layout/Container';
import { Divider, Flex, Text } from '@/components/UI';
import { LAWALLET_VERSION } from '@/constants/constants';
import { Loader } from '@/components/Loader/Loader';
import theme from '@/styles/theme';

const SpinnerView = ({ loadingText }: { loadingText?: string }) => {
  return (
    <Container size="medium">
      <Divider y={16} />
      <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
        <Logo />
        <Text align="center" color={theme.colors.gray50}>
          {LAWALLET_VERSION}
        </Text>
      </Flex>

      <Flex flex={1} direction="column" justify="center" align="center">
        <Loader />
        <Text>{loadingText}</Text>
      </Flex>
    </Container>
  );
};

export default SpinnerView;
