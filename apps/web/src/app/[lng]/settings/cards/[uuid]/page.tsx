'use client';
import Container from '@/components/Layout/Container';
import Navbar from '@/components/Layout/Navbar';
import { MainLoader } from '@/components/Loader/Loader';
import { Button, ButtonGroup, Divider, Flex, Heading, InputWithLabel } from '@/components/UI';
import { useTranslation } from '@/context/TranslateContext';
import { useParams, useRouter } from 'next/navigation';
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import LimitInput from '../components/LimitInput/LimitInput';
import { useCards, useConfig, useWalletContext } from '@lawallet/react';
import { CardPayload, CardStatus, Limit } from '@lawallet/react/types';

const defaultTXLimit: Limit = {
  name: 'Transactional limit',
  description: 'Spending limit per transaction',
  token: 'BTC',
  amount: BigInt(100000000000).toString(),
  delta: 0,
};

const defaultDailyLimit: Limit = {
  name: 'Daily limit',
  description: 'Spending limit per day',
  token: 'BTC',
  amount: BigInt(1000000000).toString(),
  delta: 86400,
};

type LimtisConfigOptions = 'tx' | 'daily';

const page = () => {
  const { t } = useTranslation();
  const [showLimit, setShowLimit] = useState<LimtisConfigOptions>('tx');
  const {
    user: { identity },
    settings,
    converter,
  } = useWalletContext();

  const config = useConfig();

  const [newConfig, setNewConfig] = useState<CardPayload>({
    name: '',
    description: '',
    status: CardStatus.ENABLED,
    limits: [defaultTXLimit, defaultDailyLimit],
  });

  const { cardsData, cardsConfig, loadInfo, updateCardConfig } = useCards({
    privateKey: identity.data.privateKey,
    config,
  });

  const router = useRouter();
  const params = useParams();

  const uuid: string = useMemo(() => params.uuid as string, []);

  const handleChangeLimit = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replaceAll(',', '').replaceAll('.', '');
    const newAmount = !inputValue ? 0 : parseInt(inputValue);

    const newLimits: Limit[] = newConfig.limits.slice();
    newLimits[showLimit === 'tx' ? 0 : 1].amount = BigInt(
      converter.convertCurrency(newAmount * 1000, settings.props.currency, 'SAT'),
    ).toString();

    setNewConfig({
      ...newConfig,
      limits: newLimits,
    });
  };

  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    const name: string = e.target.value;

    setNewConfig({
      ...newConfig,
      name,
    });
  };

  const handleChangeDesc = (e: ChangeEvent<HTMLInputElement>) => {
    const description: string = e.target.value;

    setNewConfig({
      ...newConfig,
      description,
    });
  };

  const handleSaveConfig = async () => {
    const updated: boolean = await updateCardConfig(uuid, newConfig);
    if (updated) router.push('/settings/cards');
  };

  useEffect(() => {
    if (!cardsConfig.cards?.[uuid] || !cardsData?.[uuid]) return;
    const { name, description, status, limits } = cardsConfig.cards[uuid];

    const txLimit = limits.find((limit: Limit) => {
      if (limit.delta === defaultTXLimit.delta) return limit;
    });

    const dailyLimit = limits.find((limit: Limit) => {
      if (limit.delta === defaultDailyLimit.delta) return limit;
    });

    setNewConfig({
      name,
      description,
      status,
      limits: [txLimit ?? defaultTXLimit, dailyLimit ?? defaultDailyLimit],
    });
  }, [cardsConfig.cards]);

  if (!loadInfo.loading && !cardsData?.[uuid]) return null;

  return (
    <>
      <Navbar
        showBackPage={true}
        title={loadInfo.loading ? t('LOADING') : cardsData[uuid].design.name}
        overrideBack="/settings/cards"
      />

      {loadInfo.loading ? (
        <MainLoader />
      ) : (
        <Container size="small">
          <Divider y={24} />

          <InputWithLabel
            onChange={handleChangeName}
            name="card-name"
            label={t('NAME')}
            placeholder={t('NAME')}
            value={newConfig.name}
          />

          <Divider y={12} />

          <InputWithLabel
            onChange={handleChangeDesc}
            name="card-desc"
            label={t('DESCRIPTION')}
            placeholder={t('DESCRIPTION')}
            value={newConfig.description}
          />

          <Divider y={24} />

          <Flex justify="space-between" align="center">
            <Heading as="h5">{t('LIMITS')}</Heading>

            <ButtonGroup>
              <Button
                variant={showLimit === 'tx' ? 'filled' : 'borderless'}
                onClick={() => setShowLimit('tx')}
                size="small"
              >
                {t('UNIQUE')}
              </Button>

              <Button
                variant={showLimit === 'daily' ? 'filled' : 'borderless'}
                onClick={() => setShowLimit('daily')}
                size="small"
              >
                {t('DAILY')}
              </Button>
            </ButtonGroup>
          </Flex>

          <Divider y={24} />

          <LimitInput
            onChange={handleChangeLimit}
            amount={Number(newConfig.limits[showLimit === 'tx' ? 0 : 1].amount) / 1000}
          />

          <Divider y={24} />
        </Container>
      )}

      <Flex>
        <Container size="small">
          <Divider y={16} />
          <Flex gap={8}>
            <Button variant="bezeledGray" onClick={() => router.push('/settings/cards')}>
              {t('CANCEL')}
            </Button>
            <Button onClick={handleSaveConfig}>{t('SAVE')}</Button>
          </Flex>
          <Divider y={32} />
        </Container>
      </Flex>
    </>
  );
};

export default page;