'use client';
import { CardConfigReturns, useCards, useConfig } from '@lawallet/react';
import { createContext, useContext } from 'react';
import { useNotifications } from './NotificationsContext';
import { useTranslation } from './TranslateContext';

const CardsContext = createContext({} as CardConfigReturns);

export function CardsProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const config = useConfig();

  const notifications = useNotifications();
  const { t } = useTranslation();

  const handleCardDonation = () => {
    notifications.showAlert({
      title: '',
      description: t('DONATION_CARD_SUCCESS'),
      type: 'success',
    });
  };

  const cards = useCards({
    onCardDonation: handleCardDonation,
    config,
  });

  return <CardsContext.Provider value={cards}>{children}</CardsContext.Provider>;
}

export const useCardsContext = () => {
  const context = useContext(CardsContext);
  if (!context) {
    throw new Error('useCardsContext must be used within CardsProvider');
  }

  return context;
};
