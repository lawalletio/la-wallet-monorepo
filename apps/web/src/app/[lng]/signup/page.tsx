'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { useConfig, useSubscription } from '@lawallet/react';
import { Button, Container, Divider, Feedback, Flex, Heading, Text, Icon, SatoshiIcon, CheckIcon } from '@lawallet/ui';

// Generic components
import Logo from '@/components/Logo';

// New ui-components
import { CardV2 } from '@/components/CardV2';
import { Loader } from '@/components/Icons/Loader';

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
  const router = useRouter();
  const errors = useErrors();

  const [zapRequestInfo, setZapRequestInfo] = useState<ZapRequestInfo>({
    zapRequest: null,
    invoice: null,
    payed: false,
  });

  const [nonce, setNonce] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);

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
    setLoading(true);
    try {
      const response = await fetch(`/api/signup/request`);
      const { zapRequest, invoice }: ZapRequestInfo = await response.json();
      if (!zapRequest || !invoice) return;

      setLoading(false);
      setZapRequestInfo({ zapRequest, invoice, payed: false });
    } catch {
      setLoading(false);
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

  const payWithWebLN = useCallback(async (invoice: string) => {
    try {
      setIsPaying(true);
      if (!window.webln) {
        throw new Error('WebLN not detected');
      }
      await window.webln.enable();
      await window.webln.sendPayment(invoice);
    } catch (e) {
      alert((e as Error).message);
      setIsPaying(false);
    }
  }, []);

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
        <Flex direction="column" align="center" justify="center" flex={1}>
          <Logo />
          <Divider y={8} />
          <Text align="center">Tu wallet en 10 segundos, sin KYC ni boludeces.</Text>

          {!zapRequestInfo.invoice ? (
            <>
              <Divider y={16} />
              <Flex direction="column" align="center" gap={8}>
                <Text color={appTheme.colors.gray50}>Costo</Text>
                <Flex align="center" gap={4} justify="center">
                  <Icon>
                    <SatoshiIcon />
                  </Icon>
                  <Heading>21</Heading>
                  <Text size="small">SAT</Text>
                </Flex>
              </Flex>
            </>
          ) : !zapRequestInfo.payed ? (
            <>
              <Divider y={48} />
              <Flex justify="center" align="center" direction="column" gap={8}>
                <QRCode value={zapRequestInfo.invoice} size={250} />
                {window.webln && (
                  <Button onClick={() => payWithWebLN(zapRequestInfo.invoice!)} variant="bezeled" disabled={isPaying}>
                    Pagar con Alby
                  </Button>
                )}
              </Flex>
            </>
          ) : (
            <>
              <Divider y={16} />

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
            </>
          )}
        </Flex>

        <Divider y={16} />

        {!zapRequestInfo.invoice ? (
          <Flex>
            <Button onClick={requestPayment} disabled={loading}>
              {loading ? (
                <Icon>
                  <Loader />
                </Icon>
              ) : (
                'Quiero una cuenta'
              )}
            </Button>
          </Flex>
        ) : nonce ? (
          <Flex justify="center">
            <Button onClick={() => router.push(`/start?i=${nonce}`)}>Crear billetera</Button>
          </Flex>
        ) : (
          zapRequestInfo.payed && (
            <Flex direction="column" align="center" gap={8}>
              <Icon>
                <Loader />
              </Icon>
              <Text align="center" color={appTheme.colors.gray50}>
                Estamos generando el cupón para crear tu cuenta...
              </Text>
            </Flex>
          )
        )}

        <Feedback show={errors.errorInfo.visible} status={'error'}>
          {errors.errorInfo.text}
        </Feedback>

        <Divider y={32} />
      </Container>
    </>
  );
};

export default SignUp;
