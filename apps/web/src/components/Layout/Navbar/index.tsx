'use client';

import { useRouter } from '@/navigation';
import { CaretLeftIcon } from '@bitcoin-design/bitcoin-icons-react/filled';

import { Flex, Container, Icon, Heading } from '@lawallet/ui';

import { Navbar, BackButton, Left, Right } from './style';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface ComponentProps {
  children?: ReactNode;
  title?: string;
  showBackPage?: boolean;
  overrideBack?: string;
}

export default function Component(props: ComponentProps) {
  const { children, showBackPage = false, title, overrideBack = '' } = props;

  const router = useRouter();
  const t = useTranslations();

  const onlyChildren = !children;

  return (
    <Navbar>
      <Container>
        <Flex flex={1} align="center" gap={8}>
          {onlyChildren && (
            <Left>
              {showBackPage && (
                <BackButton
                  onClick={() => {
                    overrideBack ? router.push(overrideBack) : router.back();
                  }}
                >
                  <Icon size="small">
                    <CaretLeftIcon />
                  </Icon>
                  {t('BACK')}
                </BackButton>
              )}
            </Left>
          )}
          {title ? (
            <Flex justify="center">
              <Heading as="h5">{title}</Heading>
            </Flex>
          ) : (
            children
          )}
          {onlyChildren && <Right></Right>}
        </Flex>
      </Container>
    </Navbar>
  );
}
