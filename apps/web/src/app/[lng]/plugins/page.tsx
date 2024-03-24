'use client';
import Subnavbar from '@/components/Layout/Subnavbar';
import { PLUGINS } from '@/plugins';

import { ArrowRightIcon, Button, Card, Container, Divider, Flex, Heading, Icon, Text } from '@lawallet/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Page() {
  // const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Container size="small">
        <Divider y={24} />
        <Heading>Plugins</Heading>
        <Divider y={24} />
        {Object.keys(PLUGINS).map((key) => {
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
                    <Button onClick={() => router.push(`/plugins/${key}`)} variant="borderless">
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
        })}
        <Divider y={8} />
      </Container>

      <Subnavbar path="plugins" />
    </>
  );
}
