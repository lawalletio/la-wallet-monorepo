'use client';

import { SatoshiV2Icon } from '@bitcoin-design/bitcoin-icons-react/filled';

import { Button, Container, Divider, Feedback, Flex, Heading, Icon, LinkButton, Text } from '@lawallet/ui';

import { useTranslation } from '@/context/TranslateContext';
import { formatToPreference, useWalletContext } from '@lawallet/react';
import { TransferTypes } from '@lawallet/react/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import HeroCardWithData from './HeroCardWithData';

type SummaryProps = {
  isLoading: boolean;
  isSuccess: boolean;
  data: string;
  type: TransferTypes;
  amount: number;
  expired?: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
};

export const Summary = ({ isLoading, isSuccess, data, type, amount, expired = false, onClick }: SummaryProps) => {
  const { lng, t } = useTranslation();
  const [insufficientBalance, setInsufficientBalance] = useState<boolean>(false);

  const {
    account: { balance },
    settings: {
      props: { currency },
    },
    converter: { pricesData, convertCurrency },
  } = useWalletContext();

  const convertedAmount: string = useMemo(() => {
    const convertedInt: number = convertCurrency(amount, 'SAT', currency);

    return formatToPreference(currency, convertedInt, lng);
  }, [amount, pricesData, currency]);

  const detectInsufficientBalance = useCallback(() => {
    setInsufficientBalance(!isLoading && !isSuccess && balance.amount < amount);
  }, [balance.amount, amount, isLoading, isSuccess]);

  useEffect(() => {
    detectInsufficientBalance();
  }, [balance.amount, amount]);

  return (
    <>
      <HeroCardWithData type={type} data={data} />

      <Container size="small">
        <Divider y={16} />
        <Flex direction="column" flex={1} justify="center" align="center" gap={8}>
          <Heading as="h6">Total</Heading>

          {Number(convertedAmount) !== 0 ? (
            <Flex align="center" justify="center" gap={4}>
              {currency === 'SAT' ? (
                <Icon size="small">
                  <SatoshiV2Icon />
                </Icon>
              ) : (
                <Text>$</Text>
              )}
              <Heading>{convertedAmount}</Heading>
              <Text>{currency}</Text>
            </Flex>
          ) : (
            <Flex align="center" justify="center" gap={4}>
              <Icon size="small">
                <SatoshiV2Icon />
              </Icon>
              <Heading>{amount}</Heading>
              <Text>SAT</Text>
            </Flex>
          )}
        </Flex>
        <Divider y={16} />
      </Container>

      {expired || (type !== TransferTypes.LNURLW && !balance.loading && insufficientBalance) ? (
        <Flex flex={1} align="center" justify="center">
          <Feedback show={true} status={'error'}>
            {expired ? t('INVOICE_EXPIRED') : t('INSUFFICIENT_BALANCE')}
          </Feedback>
        </Flex>
      ) : null}

      <Flex>
        <Container size="small">
          <Divider y={16} />
          <Flex gap={8}>
            <LinkButton variant="bezeledGray" href="/dashboard">
              {t('CANCEL')}
            </LinkButton>

            <Button
              color="secondary"
              onClick={onClick}
              disabled={!type || isLoading || expired || (type !== TransferTypes.LNURLW && insufficientBalance)}
              loading={isLoading}
            >
              {type === TransferTypes.LNURLW ? t('CLAIM') : t('TRANSFER')}
            </Button>
          </Flex>
          <Divider y={32} />
        </Container>
      </Flex>
    </>
  );
};
