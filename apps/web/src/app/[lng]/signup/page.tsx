'use client';

import { useRouter } from '@/navigation';
import { useConfig, useSubscription } from '@lawallet/react';
import { Button, CheckIcon, Container, Divider, Feedback, Flex, Heading, Icon, SatoshiIcon, Text } from '@lawallet/ui';
import { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk';
import { useCallback, useEffect, useState } from 'react';

// Generic components
import Logo from '@/components/Logo';

// New ui-components
import { CardV2 } from '@/components/CardV2';
import { Loader } from '@/components/Icons/Loader';

import useErrors from '@/hooks/useErrors';

import { QRCode } from '@/components/UI';
import { appTheme } from '@/config/exports';
import { signupPubkey } from '@/constants/buyAddress';
import { useTranslations } from 'next-intl';

const SIGN_UP_CACHE_KEY: string = 'signup-cache';

type ZapRequestInfo = {
  zapRequest: NostrEvent | null;
  invoice: string | null;
  payed: boolean;
  expiry?: number;
};

const SignUp = () => {
  const config = useConfig();
  const router = useRouter();
  const errors = useErrors();

  const [zapRequestInfo, setZapRequestInfo] = useState<ZapRequestInfo>({
    zapRequest: null,
    invoice: null,
    payed: false,
    expiry: 0,
  });

  const [nonce, setNonce] = useState<string>('');

  // const [nonce, setNonce] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [9735],
        since: zapRequestInfo.zapRequest?.created_at ?? 0,
        '#p': [signupPubkey],
      },
    ],
    options: {},
    enabled: Boolean(zapRequestInfo.invoice) && !zapRequestInfo.payed,
    config,
  });

  const saveZapRequestInfo = useCallback(
    (new_info: ZapRequestInfo, tmpNonce?: string) => {
      const zrExpiration: number = Date.now() + 2 * 60 * 1000;
      const ZR: ZapRequestInfo = { ...new_info, expiry: zrExpiration };

      config.storage.setItem(SIGN_UP_CACHE_KEY, JSON.stringify({ ...ZR, nonce: tmpNonce }));
      setZapRequestInfo(ZR);
    },
    [zapRequestInfo],
  );

  const requestPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/signup/request`);
      const { zapRequest, invoice }: ZapRequestInfo = await response.json();
      if (!zapRequest || !invoice) return;

      setLoading(false);
      saveZapRequestInfo({ zapRequest, invoice, payed: false });
    } catch {
      setLoading(false);
      errors.modifyError('UNEXPECTED_ERROR');
    }
  };

  const claimNonce = useCallback(
    async (zapReceipt: NDKEvent) => {
      try {
        const nostrEvent: NostrEvent = await zapReceipt.toNostrEvent();

        const response = await fetch('/api/signup/claim', {
          method: 'POST',
          body: JSON.stringify(nostrEvent),
        });
        const responseJSON: { data?: { nonce: { nonce: string } } } = await response.json();
        if (!responseJSON || !responseJSON.data || !responseJSON.data.nonce || !responseJSON.data.nonce.nonce) return;

        setNonce(responseJSON.data?.nonce.nonce ?? '');
      } catch {
        errors.modifyError('UNEXPECTED_ERROR');
      }
    },
    [zapRequestInfo],
  );

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

  const loadCachedSignUpRequest = async () => {
    try {
      const cachedStorage = await config.storage.getItem(SIGN_UP_CACHE_KEY);
      if (!cachedStorage) return;

      const cachedZapRequest = JSON.parse(cachedStorage);
      if (!cachedZapRequest || (cachedZapRequest.expiry ?? 0) < Date.now()) return;

      setZapRequestInfo(cachedZapRequest);
      setNonce(cachedZapRequest.nonce);
    } catch {
      return;
    }
  };

  const validateEvents = useCallback(() => {
    if (events.length) {
      events.map((event) => {
        const boltTag = event.getMatchingTags('bolt11')[0]?.[1];

        if (boltTag === zapRequestInfo.invoice) {
          saveZapRequestInfo({ ...zapRequestInfo, payed: true });
          claimNonce(event);
          return;
        }
      });
    }
  }, [events, zapRequestInfo]);

  useEffect(() => {
    validateEvents();
  }, [events.length]);

  useEffect(() => {
    if (zapRequestInfo.payed && nonce.length) router.push(`/start?i=${nonce}`);
  }, [zapRequestInfo, nonce]);

  useEffect(() => {
    loadCachedSignUpRequest();
  }, []);

  const t = useTranslations();

  return (
    <>
      <Divider y={60} />
      <Container size="small">
        <Flex direction="column" align="center" justify="center" flex={1}>
          <Logo />
          <Divider y={8} />
          <Text align="center">{t('YOUR_WALLET_IN_10_SECONDS')}</Text>

          {!zapRequestInfo.invoice ? (
            <>
              <Divider y={16} />
              <Flex direction="column" align="center" gap={8}>
                <Text color={appTheme.colors.gray50}>{t('COST')}</Text>
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
                    {t('PAY_WITH_ALBY')}
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
                      {t('RECEIVED_PAYMENT')}
                    </Text>
                    <Text size="small">{t('YOU_CAN_CREATE_WALLET')}</Text>
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
                t('I_WANT_AN_ACCOUNT')
              )}
            </Button>
          </Flex>
        ) : nonce.length ? (
          <Flex justify="center">
            <Button onClick={() => router.push(`/start?i=${nonce}`)}>{t('CREATE_WALLET')}</Button>
          </Flex>
        ) : (
          zapRequestInfo.payed && (
            <Flex direction="column" align="center" gap={8}>
              <Icon>
                <Loader />
              </Icon>
              <Text align="center" color={appTheme.colors.gray50}>
                {t('GENERATING_COUPON')}
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
