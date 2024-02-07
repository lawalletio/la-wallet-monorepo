import React from 'react';

import {
  HeroCard,
  Container,
  Flex,
  Text,
  Heading,
  Avatar,
  Icon,
  VisibleIcon,
  GearIcon,
  Button,
  Divider,
  SatoshiIcon,
  ReceiveIcon,
  SendIcon,
  Accordion,
  AccordionBody,
} from '../../components';

type TokenList = 'SAT' | 'USD' | 'ARS';

export const Dashboard: React.FC = () => {
  const [token, setToken] = React.useState<TokenList>('SAT');

  return (
    <>
      <HeroCard>
        <Container size="small">
          <Divider y={12} />
          <Flex justify="space-between">
            <Flex align="center" gap={8}>
              <Avatar>SN</Avatar>
              <Flex direction="column">
                <Text size="small">Hola,</Text>
                <Text>satoshi@lawallet.ar</Text>
              </Flex>
            </Flex>
            <Flex gap={4} flex={0}>
              <Button size="small" variant="bezeled" onClick={() => null}>
                <Icon size="small">
                  <VisibleIcon />
                </Icon>
              </Button>
              <Button size="small" variant="bezeled" onClick={() => null}>
                <Icon size="small">
                  <GearIcon />
                </Icon>
              </Button>
            </Flex>
          </Flex>
          <Flex direction="column" align="center" justify="center" flex={1}>
            <Text size="small">Balance</Text>
            <Divider y={8} />
            <Flex align="center" justify="center">
              <Icon size="small">
                <SatoshiIcon />
              </Icon>
              <Heading>250.000</Heading>
            </Flex>
            <Divider y={8} />
            <Flex justify="center" gap={4}>
              <Button
                size="small"
                variant={`${token === 'SAT' ? 'bezeled' : 'borderless'}`}
                onClick={() => setToken('SAT')}
                style={{ minWidth: '80px' }}
              >
                SAT
              </Button>
              <Button
                size="small"
                variant={`${token === 'USD' ? 'bezeled' : 'borderless'}`}
                onClick={() => setToken('USD')}
                style={{ minWidth: '80px' }}
              >
                USD
              </Button>
              <Button
                size="small"
                variant={`${token === 'ARS' ? 'bezeled' : 'borderless'}`}
                onClick={() => setToken('ARS')}
                style={{ minWidth: '80px' }}
              >
                ARS
              </Button>
            </Flex>
          </Flex>
        </Container>
      </HeroCard>

      <Container size="small">
        <Divider y={16} />
        <Flex gap={8}>
          <Button onClick={() => null}>
            <Icon>
              <ReceiveIcon />
            </Icon>
            Depositar
          </Button>
          <Button color="secondary" onClick={() => null}>
            <Icon>
              <SendIcon />
            </Icon>
            Transferir
          </Button>
        </Flex>
        <Divider y={16} />
        <Flex justify="space-between" align="center">
          <Text size="small">Ultima actividad</Text>
          <Button size="small" variant="borderless" onClick={() => null}>
            Ver todo
          </Button>
        </Flex>
        <Flex direction="column" gap={4}>
          <Accordion
            variant="borderless"
            trigger={
              <Flex align="center">
                <Text>Enviado</Text>
                <Flex direction="column" align="end">
                  <Text>+ 21 SAT</Text>
                  <Text size="small">$10,04 ARS</Text>
                </Flex>
              </Flex>
            }
          >
            <AccordionBody>
              <ul>
                <li>
                  <Flex align="center" justify="space-between">
                    <Text size="small">Fecha</Text>
                    <Flex direction="column" align="end">
                      <Text>12:01</Text>
                      <Text size="small">enero 6, 2024</Text>
                    </Flex>
                  </Flex>
                </li>
                <li>
                  <Flex align="center" justify="space-between">
                    <Text size="small">Mensaje</Text>
                    <Text>Testeando ando</Text>
                  </Flex>
                </li>
                <li>
                  <Flex align="center" justify="space-between">
                    <Text size="small">Estado</Text>
                    <Text>Confirmada</Text>
                  </Flex>
                </li>
              </ul>
            </AccordionBody>
          </Accordion>
        </Flex>
        <Divider y={16} />
      </Container>
    </>
  );
};
