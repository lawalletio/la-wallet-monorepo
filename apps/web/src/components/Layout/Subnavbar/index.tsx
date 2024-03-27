'use client';

import { HomeIcon, RocketIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { useRouter } from 'next/navigation';

import { Button, Container, Icon, QrCodeIcon, Text } from '@lawallet/ui';

import { useTranslation } from '@/context/TranslateContext';
import { ReactNode } from 'react';
import { SubnavbarPrimitive } from './style';
import ButtonCTA from '@/components/ButtonCTA';
import { appTheme } from '@/config/exports';

interface ComponentProps {
  children?: ReactNode;
  title?: string;
  showBackPage?: boolean;
  overrideBack?: string;
  path: string;
}

export default function Subnavbar(props: ComponentProps) {
  const { path = 'home' } = props;

  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SubnavbarPrimitive>
      <Container>
        <div className="info">
          <button onClick={() => router.push('/dashboard')} className={`${path === 'home' && 'active'}`}>
            <Icon color={appTheme.colors.text}>
              <HomeIcon />
            </Icon>
            <Text size="small" color={appTheme.colors.text}>
              {t('HOME')}
            </Text>
          </button>
          <ButtonCTA>
            <Button color="secondary" onClick={() => router.push('/scan')}>
              <QrCodeIcon />
            </Button>
          </ButtonCTA>
          <button onClick={() => router.push('/plugins')} className={`${path === 'plugins' && 'active'}`}>
            <Icon color={appTheme.colors.text}>
              <RocketIcon />
            </Icon>
            <Text size="small" color={appTheme.colors.text}>
              Plugins
            </Text>
          </button>
        </div>
      </Container>
    </SubnavbarPrimitive>
  );
}
