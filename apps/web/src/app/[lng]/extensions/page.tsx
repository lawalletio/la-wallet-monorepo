'use client';

import BackButton from '@/components/BackButton';
import Subnavbar from '@/components/Layout/Subnavbar';
import { PLUGINS } from '@/config/exports/extensions';
import { ArrowRightIcon, Button, Card, Container, Divider, Flex, Icon, Navbar, Text } from '@lawallet/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';

const pluginKeys: string[] = Object.keys(PLUGINS);

export default function Page() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <>
      <Navbar leftButton={<BackButton />} title="Plugins" />
      <Container size="small">
        <Divider y={24} />
        {!pluginKeys.length ? (
          <Text align="center">{t('PLUGINS_EMPTY')}</Text>
        ) : (
          pluginKeys.map((key) => {
            const value: { title: string; description: string } = PLUGINS[key].metadata;

            return (
              <React.Fragment key={key}>
                <Card>
                  <Flex gap={16} justify="space-between" align="center">
                    <div>
                      <Text isBold>{value.title}</Text>
                      <Text>{value.description}</Text>
                    </div>
                    <div>
                      <Button onClick={() => router.push(`/extensions/${key}`)} variant="borderless">
                        <Icon>
                          <ArrowRightIcon />
                        </Icon>
                      </Button>
                    </div>
                  </Flex>
                </Card>
                <Divider y={16} />
              </React.Fragment>
            );
          })
        )}
        <Divider y={8} />
      </Container>

      <Subnavbar path="plugins" />
    </>
  );
}