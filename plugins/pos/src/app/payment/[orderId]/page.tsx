import { Alert, Button, CheckIcon, Container, Divider, Flex, Heading, Icon, Loader, Text } from '@lawallet/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { LNURLWStatus } from '../../../types/lnurl';
import { useTheme } from 'styled-components';
import { formatToPreference, useConfig, useCurrencyConverter, useWalletContext } from '@lawallet/react';
import { ScanCardStatus } from '../../../types/card';
import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLN } from '../../../context/LN';
import { useNostr } from '../../../context/Nostr';
import { useOrder } from '../../../context/Order';
import { LNURLResponse } from '../../../types/lnurl';
import { ScanAction } from '../../../types/card';
import axios from 'axios';
import { useCard } from '../../../hooks/useCard';
import { generateInternalTransactionEvent } from '../../../lib/utils';
import { QRCode } from '../../../components/QRCode';
import Confetti from '../../../components/Confetti';

export function PaymentPage({ props }: { props?: { id: string } }) {
  // Hooks
  const router = useRouter();
  const query = useSearchParams();
  const [error, setError] = useState<string>();
  const theme = useTheme();

  if (!props) router.back();
  const { id: orderIdFromUrl } = props!;

  const { convertCurrency } = useCurrencyConverter();
  const { zapEmitterPubKey, lud06, destinationPubKey } = useLN();
  const {
    orderId,
    amount,
    products,
    isPaid,
    currentInvoice: invoice,
    emergency,
    handleEmergency,
    setIsPaid,
    loadOrder,
  } = useOrder();
  const { isAvailable, permission, status: scanStatus, scan, stop } = useCard();
  const { relays, ndk } = useNostr();
  //   const { print } = usePrint();

  const config = useConfig();

  const {
    account: { identity },
    settings,
  } = useWalletContext();

  // Local states
  const [cardStatus, setCardStatus] = useState<LNURLWStatus>(LNURLWStatus.IDLE);

  /** Functions */
  const handleBack = useCallback(() => {
    const back = query.get('back');
    if (!back) {
      router.back();
      return;
    }
    router.push(back);
  }, [router, query]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const processRegularPayment = useCallback(
    async (response: LNURLResponse) => {
      setCardStatus(LNURLWStatus.CALLBACK);
      const url = response.callback;
      const _response = await axios.get(url, {
        params: { k1: response.k1, pr: invoice },
      });

      if (_response.status < 200 || _response.status >= 300) {
        throw new Error(`Error al intentar cobrar ${_response.status}}`);
      }
      if (_response.data.status !== 'OK') {
        throw new Error(`Error al intentar cobrar ${_response.data.reason}}`);
      }
      setCardStatus(LNURLWStatus.DONE);
    },
    [invoice],
  );

  const processExtendedPayment = useCallback(
    async (response: LNURLResponse) => {
      setCardStatus(LNURLWStatus.CALLBACK);
      const url = response.callback;

      const event = generateInternalTransactionEvent({
        amount: amount * 1000,
        destinationPubKey: destinationPubKey!,
        k1: response.k1!,
        privateKey: identity.data.privateKey,
        relays: relays!,
      });

      try {
        const _response = await axios.post(url, event);
        setCardStatus(LNURLWStatus.DONE);
        const events: Set<NDKEvent> = await ndk.fetchEvents({
          kinds: [1112 as NDKKind],
          authors: [config.modulePubkeys.ledger],
          '#e': [event.id!],
          '#t': ['internal-transaction-ok', 'internal-transaction-error'],
        });
        const resultEvent: NDKEvent = events.values().next().value;
        const tValue = resultEvent.tags.find((t: string[]) => t[0] === 't')![1];
        switch (tValue) {
          case 'internal-transaction-ok':
            setIsPaid!(true);
            break;
          case 'internal-transaction-error':
            setCardStatus(LNURLWStatus.ERROR);
            setError(JSON.parse(resultEvent.content).messages[0]);
            setIsPaid!(false);
            break;
          default:
            setCardStatus(LNURLWStatus.ERROR);
            setError('No se puedo recibir evento de confirmación');
            setIsPaid!(false);
        }

        return _response;
      } catch (e) {
        console.log(e);
      }
    },
    [amount, destinationPubKey, relays, ndk, setIsPaid],
  );

  const startRead = useCallback(async () => {
    try {
      //const lnurlResponse = await scan()
      const lnurlResponse = await scan(ScanAction.EXTENDED_SCAN);

      if (lnurlResponse.tag === 'laWallet:withdrawRequest') {
        await processExtendedPayment(lnurlResponse);
      } else {
        await processRegularPayment(lnurlResponse);
      }
    } catch (e) {
      // alert(`Error con la tarjeta ${(e as Error).message}}`)
      setCardStatus(LNURLWStatus.ERROR);
      setError((e as Error).message);
    }
  }, [processExtendedPayment, processRegularPayment, scan]);

  /** useEffects */
  // Search for orderIdFromURL
  useEffect(() => {
    // Not orderId found on url
    if (!orderIdFromUrl) {
      handleBack();
      return;
    }

    // Order already set
    if (orderId) {
      return;
    }

    // fetchOrder(orderIdFromUrl as string)
    if (!loadOrder(orderIdFromUrl as string)) {
      alert('No se encontró la orden');
      handleBack();
    }
  }, [orderIdFromUrl, orderId, loadOrder]);

  // // on Invoice ready
  useEffect(() => {
    if (!invoice || !isAvailable) {
      return;
    }

    startRead();
  }, [invoice, zapEmitterPubKey]);

  // on card scanStatus change
  useEffect(() => {
    switch (scanStatus) {
      case ScanCardStatus.SCANNING:
        setCardStatus(LNURLWStatus.SCANNING);
        break;
      case ScanCardStatus.REQUESTING:
        setCardStatus(LNURLWStatus.REQUESTING);
        break;
      case ScanCardStatus.ERROR:
        setCardStatus(LNURLWStatus.ERROR);
        break;
    }
  }, [scanStatus]);

  // on Mount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <>
      {invoice && (
        <Alert
          title={''}
          description={'Disponible para escanear NFC.'}
          type={'success'}
          isOpen={cardStatus === LNURLWStatus.SCANNING}
        />
      )}

      <Alert
        title={''}
        description={cardStatus === LNURLWStatus.REQUESTING ? 'Procesando' : 'Cobrando'}
        type={'success'}
        isOpen={[LNURLWStatus.REQUESTING, LNURLWStatus.CALLBACK].includes(cardStatus)}
      />

      <Alert
        title={''}
        description={`Error al cobrar: ${error}`}
        type={'error'}
        isOpen={cardStatus === LNURLWStatus.ERROR}
      />

      {isPaid ? (
        <>
          <Confetti />
          <Container size="small">
            <Divider y={24} />
            <Flex direction="column" justify="center" flex={1} align="center" gap={8}>
              <Icon color={theme.colors.primary}>
                <CheckIcon />
              </Icon>
              <Text size="small" color={theme.colors.gray50}>
                Pago acreditado
              </Text>

              <Flex justify="center" align="center" gap={4}>
                {settings.props.currency !== 'SAT' && <Text>$</Text>}
                <Heading>
                  {formatToPreference(
                    settings.props.currency,
                    convertCurrency(amount, 'SAT', settings.props.currency),
                    'es',
                  )}
                </Heading>
              </Flex>
            </Flex>
            <Flex gap={8} direction="column">
              <Flex>
                <Button variant="bezeledGray" onClick={() => handleBack()}>
                  Volver
                </Button>
              </Flex>
            </Flex>
            <Divider y={24} />
          </Container>
        </>
      ) : (
        <>
          <Container size="small">
            <Divider y={24} />
            <Flex direction="column" justify="center" align="center" gap={8} flex={1}>
              <Loader />
              <Text size="small" color={theme.colors.gray50}>
                Esperando pago
              </Text>
              <Flex justify="center" align="center" gap={4}>
                {settings.props.currency !== 'SAT' && <Text>$</Text>}
                <Heading>
                  {formatToPreference(
                    settings.props.currency,
                    convertCurrency(amount, 'SAT', settings.props.currency),
                    'es',
                  )}
                </Heading>

                <Text>{settings.props.currency}</Text>
              </Flex>
            </Flex>
            <Divider y={24} />
          </Container>

          <QRCode value={invoice ?? ''} size={250} />

          <Flex>
            <Container size="small">
              <Divider y={16} />
              <Flex gap={8} direction="column">
                <Flex>
                  {isAvailable && permission === 'prompt' && (
                    <Button variant="bezeledGray" onClick={() => startRead()}>
                      Solicitar NFC
                    </Button>
                  )}

                  <Button variant="bezeledGray" onClick={() => handleBack()}>
                    Cancelar
                  </Button>
                  <Button
                    variant="borderless"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(invoice!);
                      } catch (error) {
                        console.log('Failed to copy: ', error);
                        return false;
                      }
                    }}
                  >
                    Copiar
                  </Button>
                </Flex>
              </Flex>
              <Divider y={24} />
            </Container>
          </Flex>
        </>
      )}
    </>
  );
}
