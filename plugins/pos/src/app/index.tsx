'use client';
import { formatToPreference, useNumpad, useWalletContext } from '@lawallet/react';
import { BtnLoader, Button, Container, Divider, Flex, Heading, Icon, Keyboard, SatoshiIcon, Text } from '@lawallet/ui';
import React, { useState } from 'react';
import { TokenList } from '../components/TokenList';

export function AppIndex() {
  // Hooks
  // const { generateOrderEvent, setAmount, setOrderEvent, clear } = useOrder();
  // const { publish } = useNostr();
  // const { setLUD06 } = useLN();
  // const { userConfig, destination } = useContext(LaWalletContext);
  const { settings } = useWalletContext();
  const numpadData = useNumpad(settings.props.currency);

  // Local states
  const [loading, setLoading] = useState<boolean>(false);
  const sats = numpadData.intAmount['SAT'];

  /** Functions */

  const handleClick = async () => {
    if (sats === 0 || loading) return;

    setLoading(true);

    try {
      // const order = generateOrderEvent!();
      // console.dir(order);
      // // console.info('Publishing order')
      // await publish!(order);
      // setOrderEvent!(order);
      // router.push('/payment/' + order.id);
    } catch (e) {
      console.warn('Error publishing order');
      console.warn(e);
      setLoading(false);
    }
  };

  /** usEffects */

  // useEffect(() => {
  //   setAmount(sats);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [sats]);

  // useEffect(() => {
  //   if (!destination || !destination.lud06) {
  //     router.push('/');
  //     console.info('No destination');
  //     return;
  //   }

  //   setLUD06(destination.lud06);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [destination]);

  // // on mount
  // useEffect(() => {
  //   clear();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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
            {loading ? <BtnLoader /> : 'Generar'}
          </Button>
        </Flex>
        <Divider y={24} />
        <Keyboard numpadData={numpadData} />
        <Divider y={24} />
      </Container>
    </>
  );
}
