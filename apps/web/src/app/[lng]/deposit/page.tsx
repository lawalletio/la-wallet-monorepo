'use client';

import Navbar from '@/components/Layout/Navbar';
import { useMemo, useState } from 'react';

import { copy } from '@/utils/share';

import { useTranslation } from '@/context/TranslateContext';

import { QRCode } from '@/components/UI';
import { Button, Container, Divider, Flex, Text } from '@lawallet/ui';

import { appTheme } from '@/constants/themeConfig';
import { useNotifications } from '@/context/NotificationsContext';
import { formatAddress, lnurl_encode, useConfig, useWalletContext } from '@lawallet/react';
import InvoiceSheet from './components/InvoiceSheet';

export default function Page() {
  const config = useConfig();
  const { t } = useTranslation();
  const notifications = useNotifications();
  const {
    account: { identity },
  } = useWalletContext();

  const [isOpenSheet, setIsOpenSheet] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    copy(text).then((res) => {
      notifications.showAlert({
        description: res ? t('SUCCESS_COPY') : t('ERROR_COPY'),
        type: res ? 'success' : 'error',
      });
    });
  };

  const LNURLEncoded: string = useMemo(
    () =>
      lnurl_encode(
        `https://${config.federation.domain}/.well-known/lnurlp/${
          identity.data.username ? identity.data.username : identity.data.npub
        }`,
      ).toUpperCase(),
    [identity],
  );

  return (
    <>
      <Navbar showBackPage={true} title={t('DEPOSIT')} />

      {identity.data.username.length ? (
        <>
          <Flex flex={1} justify="center" align="center">
            <QRCode
              size={300}
              borderSize={30}
              value={('lightning:' + LNURLEncoded).toUpperCase()}
              textToCopy={`${identity.data.username}@${config.federation.domain}`}
            />
          </Flex>
          <Flex>
            <Container size="small">
              <Divider y={16} />

              <Flex align="center">
                <Flex direction="column">
                  <Text size="small" color={appTheme.colors.gray50}>
                    {t('USER')}
                  </Text>
                  <Flex>
                    <Text>
                      {identity.data.username
                        ? `${identity.data.username}@${config.federation.domain}`
                        : formatAddress(LNURLEncoded, 20)}
                    </Text>
                  </Flex>
                </Flex>
                <div>
                  <Button
                    size="small"
                    variant="bezeled"
                    onClick={() =>
                      handleCopy(
                        identity.data.username ? `${identity.data.username}@${config.federation.domain}` : LNURLEncoded,
                      )
                    }
                  >
                    {t('COPY')}
                  </Button>
                </div>
              </Flex>

              <Divider y={16} />
            </Container>
          </Flex>

          <Flex>
            <Container size="small">
              <Divider y={16} />
              <Flex gap={8}>
                <Button
                  variant="bezeled"
                  onClick={() => {
                    setIsOpenSheet(true);
                  }}
                >
                  {t('CREATE_INVOICE')}
                </Button>
              </Flex>
              <Divider y={32} />
            </Container>
          </Flex>
        </>
      ) : null}

      <InvoiceSheet isOpen={isOpenSheet} onClose={() => setIsOpenSheet(false)} handleCopy={handleCopy} />
    </>
  );
}
