'use client';

import { CaretRightIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '@/components/Layout/Navbar';
import {
  Autocomplete,
  Button,
  Container,
  Divider,
  Feedback,
  Flex,
  Icon,
  InputGroup,
  InputGroupRight,
  LinkButton,
  Text,
  theme,
} from '@lawallet/ui';

import { useTranslation } from '@/context/TranslateContext';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';
import useErrors from '@/hooks/useErrors';
import { detectTransferType, formatLNURLData, getMultipleTags, useConfig, useWalletContext } from '@lawallet/react';
import { getUsername } from '@lawallet/react/actions';
import { TransactionDirection, TransactionType, TransferTypes } from '@lawallet/react/types';
import { useEffect, useState } from 'react';
import RecipientElement from './components/RecipientElement';

export default function Page() {
  const config = useConfig();
  const { t } = useTranslation();
  const {
    account: { identity, transactions },
  } = useWalletContext();

  const params = useSearchParams();
  const [lastDestinations, setLastDestinations] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>(params.get('data') ?? '');
  const [loading, setLoading] = useState<boolean>(false);

  const errors = useErrors();
  const router = useRouter();

  const initializeTransfer = async (data: string) => {
    if (loading) return;
    setLoading(true);

    const cleanData: string = data.trim();
    const type: TransferTypes = detectTransferType(cleanData);

    switch (type) {
      case TransferTypes.NONE:
        errors.modifyError('INVALID_RECIPIENT');
        setLoading(false);
        return;

      case TransferTypes.INVOICE:
        router.push(`/transfer/invoice/${cleanData}`);
        return;
    }

    const formattedLNURLData = await formatLNURLData(cleanData);
    if (formattedLNURLData.type === TransferTypes.NONE || formattedLNURLData.type === TransferTypes.INVOICE) {
      errors.modifyError('INVALID_RECIPIENT');
      setLoading(false);
      return;
    }

    router.push(`/transfer/lnurl?data=${cleanData}`);
    return;
  };

  const handleContinue = async () => {
    if (!inputText.length) return errors.modifyError('EMPTY_RECIPIENT');
    initializeTransfer(inputText);
  };

  useActionOnKeypress('Enter', handleContinue, [inputText]);

  const handlePasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (error) {
      console.log('error', error);
    }
  };

  const loadLastDestinations = () => {
    const lastDest: string[] = [];

    transactions.forEach(async (tx) => {
      if (tx.type === TransactionType.INTERNAL && tx.direction === TransactionDirection.OUTGOING) {
        const txPubkeys: string[] = getMultipleTags(tx.events[0].tags, 'p');
        if (txPubkeys.length !== 2) return;

        const receiverPubkey: string = txPubkeys[1];
        if (receiverPubkey === identity.data.hexpub) return;

        const username: string = await getUsername(receiverPubkey, config);

        if (username.length) {
          const formattedLud16: string = `${username}@${config.federation.domain}`;
          if (!lastDest.includes(formattedLud16)) {
            lastDest.push(formattedLud16);
            setLastDestinations(lastDest);
          }
        }
      }
    });
  };

  useEffect(() => {
    if (transactions.length) loadLastDestinations();
  }, [transactions.length]);

  return (
    <>
      <Navbar showBackPage={true} title={t('TRANSFER_MONEY')} overrideBack="/dashboard" />

      <Container size="small">
        <Divider y={16} />
        <Flex flex={1} direction="column">
          <InputGroup>
            <Autocomplete
              // Change lastDestinations for search
              data={lastDestinations}
              onSelect={setInputText}
              onChange={(e) => {
                errors.resetError();
                setInputText(e.target.value);
              }}
              placeholder={t('TRANSFER_DATA_PLACEHOLDER')}
              type="text"
              value={inputText}
              status={errors.errorInfo.visible ? 'error' : undefined}
              disabled={loading}
            />
            <InputGroupRight>
              <Button size="small" variant="borderless" onClick={handlePasteInput} disabled={!!inputText}>
                {t('PASTE')}
              </Button>
            </InputGroupRight>
          </InputGroup>

          <Feedback show={errors.errorInfo.visible} status={'error'}>
            {errors.errorInfo.text}
          </Feedback>

          <Divider y={16} />
          <Flex>
            <LinkButton color="secondary" variant="bezeled" href={'/scan'}>
              {t('SCAN_QR_CODE')}
            </LinkButton>
          </Flex>
          <Divider y={16} />
          {/* Ultimos 3 destinos */}
          {Boolean(lastDestinations.length) && (
            <>
              <Text size="small" color={theme.colors.gray50}>
                {t('LAST_RECIPIENTS')}
              </Text>

              <Divider y={12} />

              {lastDestinations.slice(0, 5).map((lud16) => {
                return (
                  <Flex key={lud16} onClick={() => initializeTransfer(lud16)} direction="column">
                    <Divider y={8} />
                    <Flex align="center">
                      <RecipientElement lud16={lud16} />
                      <Icon>
                        <CaretRightIcon />
                      </Icon>
                    </Flex>
                    <Divider y={8} />
                  </Flex>
                );
              })}
            </>
          )}
        </Flex>
      </Container>

      <Flex>
        <Container size="small">
          <Divider y={16} />
          <Flex gap={8}>
            <Button variant="bezeledGray" onClick={() => router.push('/dashboard')}>
              {t('CANCEL')}
            </Button>

            <Button onClick={handleContinue} disabled={loading || inputText.length === 0} loading={loading}>
              {t('CONTINUE')}
            </Button>
          </Flex>
          <Divider y={32} />
        </Container>
      </Flex>
    </>
  );
}
