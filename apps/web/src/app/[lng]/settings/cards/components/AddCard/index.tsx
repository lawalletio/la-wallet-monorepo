'use client';
import { Button, Flex, Text } from '@lawallet/ui';
import { Modal } from '@/components/UI';
import { useTranslations } from 'next-intl';
// import { AlertTypes } from '@/hooks/useAlerts';
import { buildCardActivationEvent, useConfig, useWalletContext } from '@lawallet/react';
import { requestCardActivation } from '@lawallet/react/actions';
import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTypes } from '@/hooks/useAlerts';
import { useNotifications } from '@/context/NotificationsContext';
import { usePathname, useRouter } from '@/navigation';

export type NewCard = {
  card: string;
  loading: boolean;
};

const defaultNewCard = {
  card: '',
  loading: false,
};

const AddNewCardModal = () => {
  const [newCardInfo, setNewCardInfo] = useState<NewCard>(defaultNewCard);

  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const config = useConfig();
  const notifications = useNotifications();

  const {
    account: { identity },
  } = useWalletContext();

  const resetCardInfo = () => {
    setNewCardInfo(defaultNewCard);
    router.replace(pathname);
  };

  const sendNotification = (alertDescription: string, alertType: AlertTypes) => {
    notifications.showAlert({
      description: alertDescription,
      type: alertType,
    });

    resetCardInfo();
  };

  const handleActivateCard = () => {
    if (newCardInfo.loading) return;
    setNewCardInfo({
      ...newCardInfo,
      loading: true,
    });

    buildCardActivationEvent(newCardInfo.card, identity.data.privateKey, config)
      .then((cardEvent: NostrEvent) => {
        requestCardActivation(cardEvent, config).then((cardActivated) => {
          const description: string = cardActivated ? t('ACTIVATE_SUCCESS') : t('ACTIVATE_ERROR');
          const type: AlertTypes = cardActivated ? 'success' : 'error';

          sendNotification(description, type);
        });
      })
      .catch(() => {
        sendNotification(t('ACTIVATE_ERROR'), 'error');
      });
  };

  useEffect(() => {
    const card: string = params.get('c') ?? '';

    setNewCardInfo({
      card,
      loading: false,
    });
  }, []);

  return (
    <Modal
      title={t('NEW_CARD')}
      isOpen={Boolean(newCardInfo.card.length)}
      onClose={() => router.push('/settings/cards')}
    >
      <Text>{t('DETECT_NEW_CARD')}</Text>
      <Flex direction="column" gap={4}>
        <Flex>
          <Button onClick={handleActivateCard}>{t('ACTIVATE_CARD')}</Button>
        </Flex>
        <Flex>
          <Button variant="borderless" onClick={resetCardInfo}>
            {t('CANCEL')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default AddNewCardModal;
