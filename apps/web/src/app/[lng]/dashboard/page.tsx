/* eslint-disable @next/next/no-img-element */
'use client';

import {
  GearIcon,
  HiddenIcon,
  QrCodeIcon,
  SatoshiV2Icon,
  SendIcon,
  VisibleIcon,
} from '@bitcoin-design/bitcoin-icons-react/filled';
import { useEffect, useMemo, useState } from 'react';

import ButtonCTA from '@/components/ButtonCTA';
import Navbar from '@/components/Layout/Navbar';
import { TokenList } from '@/components/TokenList';
import TransactionItem from '@/components/TransactionItem';
import {
  Avatar,
  BannerAlert,
  BtnLoader,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HeroCard,
  Icon,
  ReceiveIcon,
  Text,
} from '@lawallet/ui';

// Harcode data
import { useTranslation } from '@/context/TranslateContext';
import { useRouter } from 'next/navigation';

// Animations
import Animations from '@/components/Animations';
import BitcoinTrade from '@/components/Animations/bitcoin-trade.json';
import { CACHE_BACKUP_KEY } from '@/constants/constants';
import { appTheme } from '@/constants/themeConfig';
import { extractFirstTwoChars } from '@/utils';
import { copy } from '@/utils/share';
import { formatToPreference, useConfig, useWalletContext } from '@lawallet/react';
import Link from 'next/link';

export default function Page() {
  const config = useConfig();
  const { t, lng } = useTranslation();
  const [showBanner, setShowBanner] = useState<'backup' | 'none'>('none');

  const router = useRouter();
  const {
    account: { identity, balance, transactions },
    settings: {
      loading,
      toggleHideBalance,
      props: { hideBalance, currency },
    },
    converter: { pricesData, convertCurrency },
  } = useWalletContext();

  const convertedBalance: string = useMemo(() => {
    const amount: number = convertCurrency(balance.amount, 'SAT', currency);
    return formatToPreference(currency, amount, lng);
  }, [balance, pricesData, currency]);

  useEffect(() => {
    const userMadeBackup: boolean = Boolean(
      config.storage.getItem(`${CACHE_BACKUP_KEY}_${identity.data.hexpub}`) || false,
    );

    setShowBanner(!userMadeBackup ? 'backup' : 'none');
  }, []);

  return (
    <>
      <HeroCard>
        <Navbar>
          <Flex align="center" gap={8}>
            <Avatar>
              <Text size="small">{identity.data.username ? extractFirstTwoChars(identity.data.username) : 'AN'}</Text>
            </Avatar>
            <Flex direction="column">
              <Text size="small" color={appTheme.colors.gray50}>
                {t('HELLO')},
              </Text>
              <Flex
                onClick={() => {
                  if (identity.data.username) copy(`${identity.data.username}@${config.federation.domain}`);
                }}
              >
                {loading ? (
                  <Text> -- </Text>
                ) : (
                  <Text>
                    {identity.data.username ? `${identity.data.username}@${config.federation.domain}` : t('ANONYMOUS')}
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Flex gap={4} justify="end">
            <Button variant="bezeled" size="small" onClick={toggleHideBalance}>
              <Icon size="small">{hideBalance ? <HiddenIcon /> : <VisibleIcon />}</Icon>
            </Button>
            <Button variant="bezeled" size="small" onClick={() => router.push('/settings')}>
              <Icon size="small">
                <GearIcon />
              </Icon>
            </Button>
          </Flex>
        </Navbar>

        <Flex direction="column" align="center" justify="center" flex={1}>
          <Text size="small" color={appTheme.colors.gray50}>
            {t('BALANCE')}
          </Text>
          <Divider y={8} />
          <Flex justify="center" align="center" gap={4}>
            <Flex justify="center" align="center" gap={4}>
              {!hideBalance ? (
                <>
                  {currency === 'SAT' ? (
                    <Icon size="small">
                      <SatoshiV2Icon />
                    </Icon>
                  ) : (
                    <Text>$</Text>
                  )}
                </>
              ) : null}

              <Heading>{loading || balance.loading ? <BtnLoader /> : hideBalance ? '*****' : convertedBalance}</Heading>
            </Flex>
          </Flex>
          <Divider y={8} />

          {!loading && <TokenList />}
        </Flex>
      </HeroCard>

      <Container size="small">
        <Divider y={16} />
        <Flex gap={8}>
          <Button onClick={() => router.push('/deposit')}>
            <Icon>
              <ReceiveIcon />
            </Icon>
            {t('DEPOSIT')}
          </Button>
          <Button onClick={() => router.push('/transfer')} color="secondary">
            <Icon>
              <SendIcon />
            </Icon>
            {t('TRANSFER')}
          </Button>
        </Flex>
        <Divider y={16} />

        {showBanner === 'backup' ? (
          <>
            <Link href="/settings/recovery">
              <BannerAlert title={t('RECOMMEND_BACKUP')} description={t('RECOMMEND_BACKUP_REASON')} color="error" />
            </Link>
            <Divider y={16} />
          </>
        ) : null}

        {transactions.length === 0 ? (
          <Flex direction="column" justify="center" align="center" flex={1}>
            <Animations data={BitcoinTrade} />
            <Heading as="h4">{t('EMPTY_TRANSACTIONS_TITLE')}</Heading>
            <Divider y={4} />
            <Text size="small">{t('EMPTY_TRANSACTIONS_DESC')}</Text>
          </Flex>
        ) : (
          <>
            <Flex justify="space-between" align="center">
              <Text size="small" color={appTheme.colors.gray50}>
                {t('LAST_ACTIVITY').toUpperCase()}
              </Text>

              <Button size="small" variant="borderless" onClick={() => router.push('/transactions')}>
                {t('SEE_ALL')}
              </Button>
            </Flex>

            <Flex direction="column" gap={4}>
              {transactions.slice(0, 5).map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </Flex>
          </>
        )}
        <Divider y={64} />
      </Container>

      <ButtonCTA>
        <Button color="secondary" onClick={() => router.push('/scan')}>
          <QrCodeIcon />
        </Button>
      </ButtonCTA>
    </>
  );
}
