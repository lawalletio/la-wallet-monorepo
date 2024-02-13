'use client';

import { useTranslation } from '@/context/TranslateContext';

import Navbar from '@/components/Layout/Navbar';
import { MainLoader } from '@lawallet/ui';
import { Container, Divider, Flex } from '@lawallet/ui';
import AddNewCardModal from './components/AddCard';
import DebitCard from './components/DebitCard';
import EmptyCards from './components/EmptyCards';
import { buildCardTransferDonationEvent, useCards, useConfig, useWalletContext } from '@lawallet/react';
import { Design } from '@lawallet/react/types';
import { useNotifications } from '@/context/NotificationsContext';
import { useEffect, useState } from 'react';

export default function Page() {
  const {
    account: { identity },
  } = useWalletContext();

  const notifications = useNotifications();
  const config = useConfig();

  const { cardsData, cardsConfig, loadInfo, toggleCardStatus } = useCards({
    privateKey: identity.data.privateKey,
    config,
  });

  const { t } = useTranslation();
  const [cardToDonate, setCardToDonate] = useState<string>('');

  const handleToggleStatus = async (uuid: string) => {
    const toggled: boolean = await toggleCardStatus(uuid);
    if (toggled)
      notifications.showAlert({
        title: '',
        description: t('TOGGLE_STATUS_CARD_SUCCESS'),
        type: 'success',
      });

    return toggled;
  };

  const handleDonateCard = async (uuid: string) => {
    try {
      const transferDonationEvent = await buildCardTransferDonationEvent(uuid, identity.data.privateKey);

      const encodedDonationEvent: string = btoa(JSON.stringify(transferDonationEvent))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      setCardToDonate(uuid);

      return encodedDonationEvent;
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (cardToDonate) {
      const existCard = cardsData[cardToDonate];
      if (!existCard) {
        notifications.showAlert({
          title: '',
          description: t('DONATION_CARD_SUCCESS'),
          type: 'success',
        });

        setCardToDonate('');
      }
    }
  }, [cardsData, cardToDonate]);

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
                  base64DonationCardEvent={handleDonateCard}
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
