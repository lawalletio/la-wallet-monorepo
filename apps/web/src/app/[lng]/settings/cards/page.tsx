'use client';

import { useTranslation } from '@/context/TranslateContext';

import Navbar from '@/components/Layout/Navbar';
import { MainLoader } from '@/components/Loader/Loader';
import { Container, Divider, Flex } from '@lawallet/ui';
import AddNewCardModal from './components/AddCard';
import DebitCard from './components/DebitCard';
import EmptyCards from './components/EmptyCards';
import { useCards, useConfig, useWalletContext } from '@lawallet/react';
import { Design } from '@lawallet/react/types';

export default function Page() {
  const {
    account: { identity },
  } = useWalletContext();

  const config = useConfig();

  const { cardsData, cardsConfig, loadInfo, toggleCardStatus } = useCards({
    privateKey: identity.data.privateKey,
    config,
  });

  const { t } = useTranslation();

  const handleToggleStatus = async (uuid: string) => {
    const toggled: boolean = await toggleCardStatus(uuid);
    return toggled;
    // if (toggled)
    //   notifications.showAlert({
    //     title: '',
    //     description: t('TOGGLE_STATUS_CARD_SUCCESS'),
    //     type: 'success'
    //   })
  };

  return (
    <>
      <Navbar title={t('MY_CARDS')} showBackPage={true} overrideBack={'/settings'} />

      <Container size="small">
        <Divider y={16} />
        {loadInfo.loading ? (
          <MainLoader />
        ) : Object.keys(cardsData).length ? (
          <Flex direction="column" align="center" gap={16}>
            {Object.entries(cardsData).map(([key, value]) => {
              return (
                <DebitCard
                  card={{
                    uuid: key,
                    data: value as { design: Design },
                    config: cardsConfig.cards?.[key],
                  }}
                  toggleCardStatus={handleToggleStatus}
                  key={key}
                />
              );
            })}
          </Flex>
        ) : (
          <EmptyCards />
        )}
        <Divider y={16} />
      </Container>

      <AddNewCardModal />
    </>
  );
}
