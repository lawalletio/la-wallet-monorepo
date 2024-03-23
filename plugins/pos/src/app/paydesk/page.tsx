'use client';
import { formatToPreference, useConfig, useNumpad, useWalletContext } from '@lawallet/react';
import { Button, Container, Divider, Flex, Heading, Icon, Keyboard, SatoshiIcon, Text } from '@lawallet/ui';
import React, { useEffect, useState } from 'react';
import { TokenList } from '../../components/TokenList';
import { useOrder } from '../../context/Order';
import { useNostr } from '../../context/Nostr';
import { useLN } from '../../context/LN';
import { broadcastEvent, getPayRequest } from '@lawallet/react/actions';
import { useRouter } from 'next/navigation';

export function PayDesk() {
  // Hooks
  const { generateOrderEvent, setAmount, setOrderEvent, clear } = useOrder();
  const { publish } = useNostr();
  const { setLUD06 } = useLN();

  const {
    account: { identity },
    settings,
  } = useWalletContext();

  const config = useConfig();
  const router = useRouter();

  const numpadData = useNumpad(settings.props.currency);

  // Local states
  const [loading, setLoading] = useState<boolean>(false);
  const sats = numpadData.intAmount['SAT'];

  const handleClick = async () => {
    if (sats === 0 || loading) return;

    setLoading(true);

    try {
      const order = generateOrderEvent!();
      console.dir(order);
      // console.info('Publishing order')
      // await publish!(order);
      await broadcastEvent(order, config);
      setOrderEvent!(order);
      router.push('../payment/' + order.id);
    } catch (e) {
      console.warn('Error publishing order');
      console.warn(e);
      setLoading(false);
    }
  };

  /** usEffects */

  useEffect(() => {
    setAmount(sats);
  }, [sats]);

  useEffect(() => {
    if (!identity.data.username) {
      // router.push('/');
      console.info('No destination');
      return;
    }

    getPayRequest(`${config.endpoints.lightningDomain}/.well-known/lnurlp/${identity.data.username}`).then((payReq) =>
      setLUD06(payReq),
    );
  }, [identity.data]);

  // on mount
  useEffect(() => {
    clear();
  }, []);

  return (
    <>
      <Container size="small">
        <Divider y={24} />

        <Flex direction="column" gap={8} flex={1} justify="center">
          <Flex justify="center" align="center" gap={4}>
            {settings.props.currency === 'SAT' ? (
              <Icon size="small">
                <SatoshiIcon />
              </Icon>
            ) : (
              <Text>$</Text>
            )}

            <Heading>
              {formatToPreference(settings.props.currency, numpadData.intAmount[numpadData.usedCurrency], 'es')}
            </Heading>
          </Flex>
          <TokenList />
        </Flex>
        <Divider y={24} />
        <Flex gap={8}>
          <Button onClick={handleClick} disabled={loading || sats === 0} loading={loading}>
            {'Generar'}
          </Button>
        </Flex>
        <Divider y={24} />
        <Keyboard numpadData={numpadData} />
        <Divider y={24} />
      </Container>
    </>
  );
}
