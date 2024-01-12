'use client';

import Navbar from '@/components/Layout/Navbar';
import { CheckIcon, SatoshiV2Icon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { useEffect, useMemo, useState } from 'react';

import { copy } from '@/utils/share';
import { formatAddress, formatToPreference, useConfig, useSigner } from '@lawallet/react';

import { useTranslation } from '@/context/TranslateContext';
import { useNumpad } from '@/hooks/useNumpad';

import Container from '@/components/Layout/Container';
import { BtnLoader } from '@/components/Loader/Loader';
import TokenList from '@/components/TokenList';
import {
  Alert,
  Button,
  Confetti,
  Divider,
  Feedback,
  Flex,
  Heading,
  Icon,
  Keyboard,
  QRCode,
  Sheet,
  Text,
} from '@/components/UI';

import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';
import useAlert from '@/hooks/useAlerts';
import useErrors from '@/hooks/useErrors';
import theme from '@/styles/theme';
import { useSubscription, useWalletContext } from '@lawallet/react';
import { requestInvoice } from '@lawallet/react/actions';
import { SignEvent, buildZapRequestEvent, lnurl_encode } from '@lawallet/react/utils';
import { useRouter } from 'next/navigation';
import { MAX_INVOICE_AMOUNT } from '@/constants/constants';
import { NostrEvent } from '@nostr-dev-kit/ndk';

type InvoiceProps = {
  bolt11: string;
  created_at: number;
  loading: boolean;
};

type SheetTypes = 'amount' | 'qr' | 'finished';

export default function Page() {
  const config = useConfig();
  const { signer } = useSigner();
  const { lng, t } = useTranslation();
  const notifications = useAlert();
  const {
    user: { identity },
    settings: {
      props: { currency },
    },
    converter: { convertCurrency },
  } = useWalletContext();
  const numpadData = useNumpad(currency);

  const router = useRouter();
  const errors = useErrors();
  const [showSheet, setShowSeet] = useState<boolean>(false);
  const [sheetStep, setSheetStep] = useState<SheetTypes>('amount');

  const [invoice, setInvoice] = useState<InvoiceProps>({
    bolt11: '',
    created_at: 0,
    loading: false,
  });

  const { events } = useSubscription({
    filters: [
      {
        authors: [config.modulePubkeys.ledger, config.modulePubkeys.urlx],
        kinds: [9735],
        since: invoice.created_at,
      },
    ],
    options: {},
    enabled: Boolean(invoice.bolt11.length && !(sheetStep === 'finished')),
  });

  const handleClick = async () => {
    if (invoice.loading) return;

    const amountSats: number = numpadData.intAmount['SAT'];
    if (amountSats < 1 || amountSats > MAX_INVOICE_AMOUNT) {
      const convertedMinAmount: number = convertCurrency(1, 'SAT', currency);
      const convertedMaxAmount: number = convertCurrency(MAX_INVOICE_AMOUNT, 'SAT', currency);

      errors.modifyError('ERROR_INVOICE_AMOUNT', {
        minAmount: convertedMinAmount.toString(),
        maxAmount: formatToPreference(currency, convertedMaxAmount, lng),
        currency: currency,
      });
      return;
    }

    setInvoice({ ...invoice, loading: true });
    const invoice_mSats: number = amountSats * 1000;
    console.log(signer);
    const zapRequestEvent: NostrEvent | undefined = await SignEvent(
      signer!,
      buildZapRequestEvent(identity.hexpub, invoice_mSats, config),
    );
    console.log(zapRequestEvent);
    const zapRequestURI: string = encodeURI(JSON.stringify(zapRequestEvent));

    requestInvoice(
      `${config.gatewayEndpoint}/lnurlp/${identity.npub}/callback?amount=${invoice_mSats}&nostr=${zapRequestURI}`,
    )
      .then((bolt11) => {
        if (bolt11) {
          setInvoice({
            bolt11,
            created_at: Math.round(Date.now() / 1000),
            loading: false,
          });

          setSheetStep('qr');
        } else {
          errors.modifyError('ERROR_ON_CREATE_INVOICE');
        }
        return;
      })
      .catch(() => errors.modifyError('ERROR_ON_CREATE_INVOICE'));
  };

  const handleCloseSheet = () => {
    if (sheetStep === 'finished' || !identity.username.length) {
      router.push('/dashboard');
    } else {
      numpadData.resetAmount();
      setShowSeet(false);
      setSheetStep('amount');
      setInvoice({ bolt11: '', created_at: 0, loading: false });
    }
  };

  useEffect(() => {
    if (events.length) {
      events.map((event) => {
        const boltTag = event.getMatchingTags('bolt11')[0]?.[1];
        if (boltTag === invoice.bolt11) setSheetStep('finished');
      });
    }
  }, [events.length]);

  const handleCopy = (text: string) => {
    copy(text).then((res) => {
      notifications.showAlert({
        description: res ? t('SUCCESS_COPY') : t('ERROR_COPY'),
        type: res ? 'success' : 'error',
      });
    });
  };

  useEffect(() => {
    if (errors.errorInfo.visible) errors.resetError();
  }, [numpadData.intAmount]);

  useActionOnKeypress('Enter', handleClick, [numpadData.intAmount['SAT']]);

  const LNURLEncoded: string = useMemo(
    () =>
      lnurl_encode(
        `https://${config.federation.domain}/.well-known/lnurlp/${
          identity.username ? identity.username : identity.npub
        }`,
      ).toUpperCase(),
    [identity],
  );

  return (
    <>
      <Navbar showBackPage={true} title={t('DEPOSIT')} />

      <Alert
        title={notifications.alert?.title}
        description={notifications.alert?.description}
        type={notifications.alert?.type}
        isOpen={!!notifications.alert}
      />

      {identity.username.length ? (
        <>
          <Flex flex={1} justify="center" align="center">
            <QRCode
              size={300}
              borderSize={30}
              value={('lightning:' + LNURLEncoded).toUpperCase()}
              textToCopy={`${identity.username}@${config.federation.domain}`}
            />
          </Flex>
          <Flex>
            <Container size="small">
              <Divider y={16} />

              <Flex align="center">
                <Flex direction="column">
                  <Text size="small" color={theme.colors.gray50}>
                    {t('USER')}
                  </Text>
                  <Flex>
                    <Text>
                      {identity.username
                        ? `${identity.username}@${config.federation.domain}`
                        : formatAddress(LNURLEncoded, 20)}
                    </Text>
                  </Flex>
                </Flex>
                <div>
                  <Button
                    size="small"
                    variant="bezeled"
                    onClick={() =>
                      handleCopy(identity.username ? `${identity.username}@${config.federation.domain}` : LNURLEncoded)
                    }
                  >
                    {t('COPY')}
                  </Button>
                </div>
              </Flex>

              <Divider y={16} />
            </Container>
          </Flex>

          <Flex>
            <Container size="small">
              <Divider y={16} />
              <Flex gap={8}>
                <Button
                  variant="bezeled"
                  onClick={() => {
                    setShowSeet(true);
                  }}
                >
                  {t('CREATE_INVOICE')}
                </Button>
              </Flex>
              <Divider y={32} />
            </Container>
          </Flex>
        </>
      ) : null}

      <Sheet
        title={
          sheetStep === 'amount'
            ? t('DEFINE_AMOUNT')
            : sheetStep === 'qr'
              ? t('WAITING_PAYMENT')
              : t('PAYMENT_RECEIVED')
        }
        isOpen={showSheet || !identity.username.length}
        onClose={handleCloseSheet}
      >
        {sheetStep === 'amount' && (
          <>
            <Container size="small">
              <Flex direction="column" gap={8} flex={1} justify="center" align="center">
                <Flex justify="center" align="center" gap={4}>
                  {currency === 'SAT' ? (
                    <Icon size="small">
                      <SatoshiV2Icon />
                    </Icon>
                  ) : (
                    <Text>$</Text>
                  )}
                  <Heading>{formatToPreference(currency, numpadData.intAmount[numpadData.usedCurrency], lng)}</Heading>
                </Flex>
                <TokenList />

                <Feedback show={errors.errorInfo.visible} status={'error'}>
                  {errors.errorInfo.text}
                </Feedback>
              </Flex>
              <Divider y={24} />
              <Flex gap={8}>
                <Button onClick={handleClick} disabled={invoice.loading || numpadData.intAmount['SAT'] === 0}>
                  {invoice.loading ? <BtnLoader /> : t('GENERATE')}
                </Button>
              </Flex>
              <Divider y={24} />
              <Keyboard numpadData={numpadData} />
            </Container>
          </>
        )}

        {sheetStep === 'qr' && (
          <>
            <Flex flex={1} justify="center" align="center">
              <QRCode size={300} value={`${invoice.bolt11.toUpperCase()}`} />
            </Flex>
            <Divider y={24} />
            <Container size="small">
              <Flex direction="column" justify="center" align="center" flex={1} gap={8}>
                <BtnLoader />
                <Text size="small" color={theme.colors.gray50}>
                  {t('WAITING_PAYMENT_OF')}
                </Text>
                <Flex justify="center" align="center" gap={4}>
                  {currency === 'SAT' ? (
                    <Icon size="small">
                      <SatoshiV2Icon />
                    </Icon>
                  ) : (
                    <Text>$</Text>
                  )}
                  <Heading>{formatToPreference(currency, numpadData.intAmount[numpadData.usedCurrency], lng)} </Heading>

                  <Text>{currency}</Text>
                </Flex>
              </Flex>
              <Divider y={24} />
              <Flex gap={8}>
                <Button variant="bezeledGray" onClick={handleCloseSheet}>
                  {t('CANCEL')}
                </Button>
                <Button variant="bezeled" onClick={() => handleCopy(invoice.bolt11)}>
                  {t('COPY')}
                </Button>
              </Flex>
            </Container>
          </>
        )}

        {sheetStep === 'finished' && (
          <>
            <Confetti />
            <Container size="small">
              <Flex direction="column" justify="center" flex={1} align="center" gap={8}>
                <Icon color={theme.colors.primary}>
                  <CheckIcon />
                </Icon>
                <Text size="small" color={theme.colors.gray50}>
                  {t('PAYMENT_RECEIVED')}
                </Text>
                <Flex justify="center" align="center" gap={4}>
                  {currency === 'SAT' ? (
                    <Icon size="small">
                      <SatoshiV2Icon />
                    </Icon>
                  ) : (
                    <Text>$</Text>
                  )}
                  <Heading>{formatToPreference(currency, numpadData.intAmount[numpadData.usedCurrency], lng)}</Heading>
                </Flex>
              </Flex>
              <Flex gap={8}>
                <Button variant="bezeledGray" onClick={handleCloseSheet}>
                  {t('CLOSE')}
                </Button>
              </Flex>
            </Container>
          </>
        )}
      </Sheet>
    </>
  );
}
