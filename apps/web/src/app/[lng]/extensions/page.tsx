'use client';

import BackButton from '@/components/BackButton';
import Subnavbar from '@/components/Layout/Subnavbar';
import { PLUGINS } from '@/plugins';
import { ArrowRightIcon, Button, Card, Container, Divider, Flex, Icon, Navbar, Text } from '@lawallet/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Page() {
  const router = useRouter();

  return (
    <>
      <Navbar leftButton={<BackButton />} title="Plugins" />
      <Container size="small">
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
        })}
        <Divider y={8} />
      </Container>

      <Subnavbar path="plugins" />
    </>
  );
}
