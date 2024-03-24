import { normalizeLNDomain, useConfig, useWalletContext } from '@lawallet/react';
import { Container, Divider, Flex, Heading, Icon, Text } from '@lawallet/ui';
import Link from 'next/link';
import React from 'react';
import { Box } from '../components/Box';
import { PantheonIcon, SharedWalletIcon } from '@bitcoin-design/bitcoin-icons-react/filled';

export const AppIndex = () => {
  const { account } = useWalletContext();
  const config = useConfig();
  return (
    <>
      <Container size="small">
        <Divider y={24} />

        <Flex direction="column" gap={8} flex={1} justify="center">
          <>
            <Heading as="h4">
              {account.identity.data.username}@{normalizeLNDomain(config.endpoints.lightningDomain)}
            </Heading>
            <Flex gap={8}>
              <Box>
                <Link href="./paydesk">
                  <Icon>
                    <PantheonIcon />
                  </Icon>
                  <Flex direction="column" gap={4}>
                    <Heading as="h5">Caja</Heading>
                    <Text size="small">Medio de cobro para tu negocio.</Text>
                  </Flex>
                </Link>
              </Box>
              <Box color="secondary">
                <Link href="#">
                  <Icon>
                    <SharedWalletIcon />
                  </Icon>
                  <Flex direction="column" gap={4}>
                    <Heading as="h5">Arbolito</Heading>
                    <Text size="small">Transferi dinero de una tarjeta a otra.</Text>
                  </Flex>
                </Link>
              </Box>
            </Flex>
          </>
        </Flex>
        <Divider y={24} />

        <Divider y={24} />
      </Container>
    </>
  );
};
