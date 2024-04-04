'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { useConfig, useSubscription } from '@lawallet/react';
import {
  Button,
  Container,
  Divider,
  Feedback,
  Flex,
  Heading,
  Loader,
  Text,
  Icon,
  SatoshiIcon,
  CheckIcon,
} from '@lawallet/ui';
import { CardV2 } from '@/components/CardV2';

import useErrors from '@/hooks/useErrors';

import { QRCode } from '@/components/UI';
import { appTheme } from '@/config/exports';

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
  const errors = useErrors();

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
    try {
      const response = await fetch(`/api/signup/request`);
      const { zapRequest, invoice }: ZapRequestInfo = await response.json();
      if (!zapRequest || !invoice) return;

      setZapRequestInfo({ zapRequest, invoice, payed: false });
    } catch {
      errors.modifyError('UNEXPECTED_ERROR');
    }
  };

  const claimNonce = async (zapReceipt: NDKEvent) => {
    try {
      const nostrEvent: NostrEvent = await zapReceipt.toNostrEvent();

      const response = await fetch('/api/signup/claim', {
        method: 'POST',
        body: JSON.stringify(nostrEvent),
      });
      const responseJSON: { data?: { nonce: { nonce: string } } } = await response.json();
      if (!responseJSON || !responseJSON.data || !responseJSON.data.nonce || !responseJSON.data.nonce.nonce) return;

      setNonce(responseJSON.data.nonce.nonce);
    } catch {
      errors.modifyError('UNEXPECTED_ERROR');
    }
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
    <>
      <Divider y={60} />
      <Container size="small">
        <Heading align="center">Sign Up</Heading>
        <Divider y={8} />
        <Text align="center">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua.
        </Text>

        <Divider y={16} />

        {!zapRequestInfo.invoice ? (
          <>
            <Flex direction="column" align="center" gap={8}>
              <Text color={appTheme.colors.gray50}>Costo</Text>
              <Flex align="center" gap={4} justify="center">
                <Icon>
                  <SatoshiIcon />
                </Icon>
                <Heading>221</Heading>
                <Text size="small">SAT</Text>
              </Flex>
            </Flex>

            <Divider y={12} />
            <Flex>
              <Button onClick={requestPayment}>Quiero una cuenta</Button>
            </Flex>
          </>
        ) : !zapRequestInfo.payed ? (
          <>
            <Divider y={48} />
            <Flex justify="center">
              <QRCode value={zapRequestInfo.invoice} size={250} />
            </Flex>
          </>
        ) : (
          <>
            <CardV2 variant="filled" spacing={4}>
              <Flex gap={16}>
                <Icon color={appTheme.colors.primary}>
                  <CheckIcon />
                </Icon>
                <Flex direction="column" gap={8}>
                  <Text isBold color={appTheme.colors.primary}>
                    Pago recibido
                  </Text>
                  <Text size="small">Ya podes crear tu billetera!</Text>
                </Flex>
              </Flex>
            </CardV2>

            <Divider y={16} />

            {nonce ? (
              <>
                <Text align="center" size="small">
                  Ya podes crear tu billetera!
                </Text>

                <Divider y={16} />

                <Flex justify="center">
                  <Button color="secondary" onClick={() => router.push(`/start?i=${nonce}`)}>
                    Crear billetera
                  </Button>
                </Flex>
              </>
            ) : (
              <Flex direction="column" align="center">
                <Loader />
                <Text align="center" color={appTheme.colors.gray50}>
                  Estamos generando el cupon para crear tu cuenta...
                </Text>
              </Flex>
            )}
          </>
        )}

        <Feedback show={errors.errorInfo.visible} status={'error'}>
          {errors.errorInfo.text}
        </Feedback>
      </Container>
    </>
  );
};

export default SignUp;
