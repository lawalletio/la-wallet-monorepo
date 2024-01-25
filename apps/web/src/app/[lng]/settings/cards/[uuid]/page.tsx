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

type LimitsConfigOptions = 'tx' | 'daily';

const page = () => {
  const { t } = useTranslation();
  const [showLimit, setShowLimit] = useState<LimitsConfigOptions>('tx');
  const {
    user: { identity },
    settings,
    converter,
  } = useWalletContext();

  const config = useConfig();
  const router = useRouter();
  const params = useParams();

  const uuid: string = useMemo(() => params.uuid as string, []);

  const { cardsData, cardsConfig, loadInfo, updateCardConfig } = useCards({
    privateKey: identity.data.privateKey,
    config,
  });

  const [configLimits, setConfigLimits] = useState<Record<LimitsConfigOptions, number>>({
    tx: 0,
    daily: 0,
  });

  const [newConfig, setNewConfig] = useState<CardPayload>({
    name: '',
    description: '',
    status: CardStatus.ENABLED,
    limits: [defaultTXLimit, defaultDailyLimit],
  });

  const handleChangeLimit = (e: ChangeEvent<HTMLInputElement>) => {
    const inputAmount: number = !e.target.value ? 0 : parseFloat(e.target.value);
    setConfigLimits({
      ...configLimits,
      [showLimit]: inputAmount,
    });
    // const newValue = converter.convertCurrency(inputAmount, settings.props.currency, 'SAT') * 1000;
    // const newLimits: Limit[] = newConfig.limits.slice();
    // newLimits[showLimit === 'tx' ? 0 : 1].amount = BigInt(newValue).toString();
    // setNewConfig({
    //   ...newConfig,
    //   limits: newLimits,
    // });
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
    const updated: boolean = await updateCardConfig(uuid, {
      ...newConfig,
      limits: [
        {
          ...newConfig.limits[0],
          amount: BigInt(converter.convertCurrency(configLimits.tx, settings.props.currency, 'SAT') * 1000).toString(),
        },
        {
          ...newConfig.limits[1],
          amount: BigInt(
            converter.convertCurrency(configLimits.daily, settings.props.currency, 'SAT') * 1000,
          ).toString(),
        },
      ],
    });
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

    const preloadConfig = {
      name,
      description,
      status,
      limits: [txLimit ?? defaultTXLimit, dailyLimit ?? defaultDailyLimit],
    };

    setNewConfig(preloadConfig);

    setConfigLimits({
      tx: converter.convertCurrency(Number(preloadConfig.limits[0].amount) / 1000, 'SAT', settings.props.currency),
      daily: converter.convertCurrency(Number(preloadConfig.limits[1].amount) / 1000, 'SAT', settings.props.currency),
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
            amount={configLimits[showLimit]}
            currency={settings.props.currency}
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
