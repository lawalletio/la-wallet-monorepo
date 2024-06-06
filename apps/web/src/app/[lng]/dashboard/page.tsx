/* eslint-disable @next/next/no-img-element */
'use client';

// Libraries
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'styled-components';
import { useLocale, useTranslations } from 'next-intl';
import { formatToPreference, useConfig, useWalletContext } from '@lawallet/react';
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
import {
  GearIcon,
  HiddenIcon,
  QrCodeIcon,
  SatoshiV2Icon,
  SendIcon,
  VisibleIcon,
} from '@bitcoin-design/bitcoin-icons-react/filled';

// Theme
import { appTheme } from '@/config/exports';

// Hooks and utils
import { Link, useRouter } from '@/navigation';

// Components
import Animations from '@/components/Animations';
import BitcoinTrade from '@/components/Animations/bitcoin-trade.json';
import Subnavbar from '@/components/Layout/Subnavbar';
import Navbar from '@/components/Layout/Navbar';
import { TokenList } from '@/components/TokenList';
import TransactionItem from '@/components/TransactionItem';

// Constans
import { CACHE_BACKUP_KEY, EMERGENCY_LOCK_DEPOSIT, EMERGENCY_LOCK_TRANSFER } from '@/constants/constants';

export default function Page() {
  const config = useConfig();
  const t = useTranslations();
  const lng = useLocale();
  const theme = useTheme();

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

  const checkBackup = async () => {
    const userMadeBackup: boolean = Boolean(
      (await config.storage.getItem(`${CACHE_BACKUP_KEY}_${identity.hexpub}`)) || false,
    );

    setShowBanner(!userMadeBackup ? 'backup' : 'none');
  };

  useEffect(() => {
    checkBackup();
  }, []);

  return (
    <>
      <HeroCard>
        <Navbar>
          <Flex align="center" gap={8}>
            <div>
              <Button variant="bezeled" size="small" onClick={() => router.push('/p')}>
                <Avatar
                  size={8}
                  src="https://cdn.discordapp.com/avatars/485320853786198020/51e5cf8708a462e03c18e68b19239c4d.webp?size=240"
                  alt={identity.lud16}
                />
                <Flex direction="column">
                  <Text size="small">Jona</Text>
                  <Text size="small" color={theme.colors.text}>
                    dios@lawallet.ar
                  </Text>
                </Flex>
              </Button>
            </div>
          </Flex>
          <Flex gap={4} justify="end">
            {Number(balance.amount) > 0 && (
              <Button variant="bezeled" size="small" onClick={toggleHideBalance}>
                <Icon size="small">{hideBalance ? <HiddenIcon /> : <VisibleIcon />}</Icon>
              </Button>
            )}
            <Button variant="bezeled" size="small" onClick={() => router.push('/settings')}>
              <Icon size="small">
                <GearIcon />
              </Icon>
            </Button>
          </Flex>
        </Navbar>

        <Divider y={12} />

        <Flex direction="column" align="center" justify="center">
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

        <Divider y={12} />
      </HeroCard>

      <Container size="small">
        <Divider y={16} />
        <Flex gap={8}>
          <Button onClick={() => router.push('/deposit')} disabled={EMERGENCY_LOCK_DEPOSIT}>
            <Icon>
              <ReceiveIcon />
            </Icon>
            {t('DEPOSIT')}
          </Button>
          <Button
            onClick={() => router.push('/transfer')}
            color="secondary"
            disabled={EMERGENCY_LOCK_TRANSFER || Number(balance.amount) === 0}
          >
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

      <Subnavbar path="home" />
    </>
  );
}
