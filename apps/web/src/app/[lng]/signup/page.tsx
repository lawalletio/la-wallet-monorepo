'use client';
import { QRCode } from '@/components/UI';
import { useConfig, useSubscription } from '@lawallet/react';
import { Button, Container, Divider, Flex, Heading, Loader, Text } from '@lawallet/ui';
import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ZapRequestInfo = {
  zapRequest: NostrEvent | null;
  invoice: string | null;
  payed: boolean;
};

const SignUp = () => {
  const config = useConfig();
  const [zapRequestInfo, setZapRequestInfo] = useState<ZapRequestInfo>({
    zapRequest: null,
    invoice: null,
    payed: false,
  });

  const [nonce, setNonce] = useState<string>('');
  const router = useRouter();

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [9735],
        since: zapRequestInfo.zapRequest?.created_at ?? 0,
      },
    ],
    options: {},
    enabled: Boolean(zapRequestInfo.invoice) && !zapRequestInfo.payed,
    config,
  });

  const requestPayment = async () => {
    const response = await fetch(`/api/signup/request`);
    const { zapRequest, invoice }: ZapRequestInfo = await response.json();
    if (!zapRequest || !invoice) return;

    setZapRequestInfo({ zapRequest, invoice, payed: false });
  };

  const claimNonce = async (zapReceipt: NDKEvent) => {
    const nostrEvent: NostrEvent = await zapReceipt.toNostrEvent();
    console.log(nostrEvent);

    const response = await fetch('/api/signup/claim', {
      method: 'POST',
      body: JSON.stringify(nostrEvent),
    });
    const responseJSON: { data?: { nonce: { nonce: string } } } = await response.json();
    if (!responseJSON || !responseJSON.data || !responseJSON.data.nonce || !responseJSON.data.nonce.nonce) return;

    setNonce(responseJSON.data.nonce.nonce);
  };

  useEffect(() => {
    if (events.length) {
      events.map((event) => {
        const boltTag = event.getMatchingTags('bolt11')[0]?.[1];

        if (boltTag === zapRequestInfo.invoice) {
          setZapRequestInfo((prev) => {
            return { ...prev, payed: true };
          });

          claimNonce(event);
        }
      });
    }
  }, [events.length]);

  return (
    <Container>
      <Heading align="center">Sign Up</Heading>

      <Divider y={20} />

      <Text align="center">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Text>

      <Divider y={20} />
      <Divider y={20} />

      {!zapRequestInfo.invoice ? (
        <>
          <Text align="center">Costo: 21 sats</Text>

          <Flex flex={1} align="center">
            <Button onClick={requestPayment}>Quiero una cuenta</Button>
          </Flex>
        </>
      ) : !zapRequestInfo.payed ? (
        <Flex flex={1} justify="center">
          <QRCode value={zapRequestInfo.invoice} size={250} />
        </Flex>
      ) : (
        <Container>
          <Flex justify="center">
            <Text>Pago recibido</Text>
          </Flex>

          <Divider y={16} />

          {nonce ? (
            <Container>
              <Text align="center">Ya podes crear tu billetera!</Text>

              <Divider y={12} />

              {/* <Text align="center">{`${window.location.origin}/start?i=${nonce}`}</Text> */}
              {/* <Divider y={12} /> */}

              <Flex flex={1} justify="center">
                <Button onClick={() => router.push(`/start?i=${nonce}`)}>Crear billetera</Button>
              </Flex>
            </Container>
          ) : (
            <Container>
              <Text align="center">Estamos generando el cupon para crear tu cuenta...</Text>

              <Flex flex={1} justify="center">
                <Loader />
              </Flex>
            </Container>
          )}
        </Container>
      )}
    </Container>
  );
};

export default SignUp;
