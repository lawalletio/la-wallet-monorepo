'use client';

import { SatoshiV2Icon } from '@bitcoin-design/bitcoin-icons-react/filled';

import {
  Avatar,
  Button,
  Container,
  Divider,
  Feedback,
  Flex,
  Heading,
  HeroCard,
  Icon,
  LinkButton,
  Text,
} from '@lawallet/ui';

import { useTranslation } from '@/context/TranslateContext';
import { extractFirstTwoChars } from '@/utils';
import { formatAddress, formatToPreference, splitHandle, useWalletContext } from '@lawallet/react';
import { TransferTypes } from '@lawallet/react/types';
import { useEffect, useMemo, useState } from 'react';

type SummaryProps = {
  isLoading: boolean;
  isSuccess: boolean;
  data: string;
  type: string;
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

  useEffect(() => {
    setInsufficientBalance(!isLoading && !isSuccess && balance.amount < amount);
  }, [balance.amount, amount]);

  const [transferUsername, transferDomain] = splitHandle(data);

  return (
    <>
      <HeroCard>
        <Container>
          <Flex direction="column" align="center" justify="center" gap={8} flex={1}>
            {type === TransferTypes.LNURLW ? (
              <Text size="small">{t('CLAIM_THIS_INVOICE')}</Text>
            ) : (
              <Avatar size="large">
                <Text size="small">{extractFirstTwoChars(transferUsername)}</Text>
              </Avatar>
            )}

            {type === TransferTypes.INVOICE || type === TransferTypes.LNURLW ? (
              <Flex justify="center">
                <Text>{formatAddress(data, 15)}</Text>
              </Flex>
            ) : (
              <Flex justify="center">
                <Text>
                  {transferUsername}@{transferDomain}
                </Text>
              </Flex>
            )}
          </Flex>
        </Container>
      </HeroCard>

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

      {expired ||
        (type !== TransferTypes.LNURLW && !balance.loading && insufficientBalance && (
          <Flex flex={1} align="center" justify="center">
            <Feedback show={true} status={'error'}>
              {expired ? t('INVOICE_EXPIRED') : t('INSUFFICIENT_BALANCE')}
            </Feedback>
          </Flex>
        ))}

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
