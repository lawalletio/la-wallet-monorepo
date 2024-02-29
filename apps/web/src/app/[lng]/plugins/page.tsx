'use client';
import Subnavbar from '@/components/Layout/Subnavbar';
import plugins from '@/config/plugins.json';

import { ArrowRightIcon, Button, Card, Container, Divider, Flex, Heading, Icon, Text } from '@lawallet/ui';
import { useRouter } from 'next/navigation';

export default function Page() {
  // const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Container size="small">
        <Divider y={24} />
        <Heading>Plugins</Heading>
        <Divider y={24} />
        {Object.keys(plugins).map((key) => {
          const value: { title: string; description: string; package: string } = plugins[key];

          return (
            <Card key={key}>
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
          );
        })}
        <Divider y={8} />
        <Divider y={24} />
      </Container>

      <Subnavbar path="plugins" />
    </>
  );
}
