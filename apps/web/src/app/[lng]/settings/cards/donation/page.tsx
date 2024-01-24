'use client';
import Navbar from '@/components/Layout/Navbar';
import { Button, Flex, Modal, Text } from '@/components/UI';
import { useTranslation } from '@/context/TranslateContext';
import { buildCardTransferAcceptEvent, useConfig, useWalletContext } from '@lawallet/react';
import { requestCardActivation } from '@lawallet/react/actions';
import { NostrEvent } from '@nostr-dev-kit/ndk';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const page = () => {
  const [base64Event, setBase64Event] = useState<string>('');
  const { t } = useTranslation();

  const config = useConfig();
  const router = useRouter();
  const params = useSearchParams();
  const {
    user: { identity },
  } = useWalletContext();

  const handleAcceptCardTransfer = () => {
    try {
      const event: NostrEvent = JSON.parse(atob(base64Event));
      buildCardTransferAcceptEvent(event.pubkey, event, identity.data.privateKey, config).then((buildedEvent) => {
        requestCardActivation(buildedEvent, config).then((res) => {
          if (res) router.push('/settings/cards');
        });
      });
    } catch {
      return;
    }
  };

  useEffect(() => {
    const paramEvent: string = params.get('event') ?? '';
    if (!paramEvent || !identity.data.privateKey) return;

    setBase64Event(paramEvent);
  }, [identity.data.privateKey]);

  return (
    <>
      <Navbar showBackPage={true} title={'Recibir tarjeta'} overrideBack="/settings/cards" />

      <Modal title={t('NEW_CARD')} isOpen={Boolean(base64Event.length)} onClose={() => null}>
        <Text>{t('DETECT_NEW_CARD')}</Text>
        <Flex direction="column" gap={4}>
          <Flex>
            <Button onClick={handleAcceptCardTransfer}>{t('ACTIVATE_CARD')}</Button>
          </Flex>
          <Flex>
            <Button variant="borderless" onClick={() => router.push('/settings/cards')}>
              {t('CANCEL')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default page;
