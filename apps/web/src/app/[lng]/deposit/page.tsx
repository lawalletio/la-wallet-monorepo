'use client';

import Navbar from '@/components/Layout/Navbar';
import { CheckIcon, SatoshiV2Icon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { useEffect, useMemo, useState } from 'react';

import { copy } from '@/utils/share';

import { useTranslation } from '@/context/TranslateContext';
import { useNumpad } from '@/hooks/useNumpad';

import { BtnLoader } from '@/components/Loader/Loader';
import TokenList from '@/components/TokenList';

import { Confetti, Keyboard, QRCode } from '@/components/UI';
import { Button, Container, Divider, Feedback, Flex, Heading, Icon, Sheet, Text, theme } from '@lawallet/ui';

import { MAX_INVOICE_AMOUNT } from '@/constants/constants';
import { useNotifications } from '@/context/NotificationsContext';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';
import useErrors from '@/hooks/useErrors';
import { formatAddress, formatToPreference, lnurl_encode, useConfig, useWalletContext, useZap } from '@lawallet/react';
import { useRouter } from 'next/navigation';

type SheetTypes = 'amount' | 'qr' | 'finished';

export default function Page() {
  const config = useConfig();
  const { lng, t } = useTranslation();
  const notifications = useNotifications();
  const {
    account: { identity },
    settings: {
      props: { currency },
    },
    converter: { convertCurrency },
  } = useWalletContext();
  const numpadData = useNumpad(currency);

  const { invoice, createZapInvoice, resetInvoice } = useZap({ receiverPubkey: identity.data.hexpub });
  const router = useRouter();
  const errors = useErrors();
  const [showSheet, setShowSeet] = useState<boolean>(false);
  const [sheetStep, setSheetStep] = useState<SheetTypes>('amount');

  const handleClick = () => {
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

    createZapInvoice(amountSats).then((bolt11: string | undefined) => {
      if (!bolt11) {
        errors.modifyError('ERROR_ON_CREATE_INVOICE');
        return;
      }

      setSheetStep('qr');
    });
  };

  const handleCloseSheet = () => {
    if (sheetStep === 'finished' || !identity.data.username.length) {
      router.push('/dashboard');
    } else {
      numpadData.resetAmount();
      setShowSeet(false);
      setSheetStep('amount');
      resetInvoice();
    }
  };

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

  useEffect(() => {
    if (invoice.payed) setSheetStep('finished');
  }, [invoice.payed]);

  useActionOnKeypress('Enter', handleClick, [numpadData.intAmount['SAT']]);

  const LNURLEncoded: string = useMemo(
    () =>
      lnurl_encode(
        `https://${config.federation.domain}/.well-known/lnurlp/${
          identity.data.username ? identity.data.username : identity.data.npub
        }`,
      ).toUpperCase(),
    [identity],
  );

  return (
    <>
      <Navbar showBackPage={true} title={t('DEPOSIT')} />

      {identity.data.username.length ? (
        <>
          <Flex flex={1} justify="center" align="center">
            <QRCode
              size={300}
              borderSize={30}
              value={('lightning:' + LNURLEncoded).toUpperCase()}
              textToCopy={`${identity.data.username}@${config.federation.domain}`}
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
                      {identity.data.username
                        ? `${identity.data.username}@${config.federation.domain}`
                        : formatAddress(LNURLEncoded, 20)}
                    </Text>
                  </Flex>
                </Flex>
                <div>
                  <Button
                    size="small"
                    variant="bezeled"
                    onClick={() =>
                      handleCopy(
                        identity.data.username ? `${identity.data.username}@${config.federation.domain}` : LNURLEncoded,
                      )
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
        isOpen={showSheet || !identity.data.username.length}
        closeText={t('CLOSE')}
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
