import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeftIcon } from '@bitcoin-design/bitcoin-icons-react/filled';
import { Icon } from '@lawallet/ui';
import { useTranslation } from '@/context/TranslateContext';
import { BackButtonStyled } from './style';

interface ComponentProps {
  overrideBack?: string;
}

const BackButton = ({ overrideBack }: ComponentProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <BackButtonStyled
      onClick={() => {
        overrideBack ? router.push(overrideBack) : router.back();
      }}
    >
      <Icon size="small">
        <CaretLeftIcon />
      </Icon>
      {t('BACK')}
    </BackButtonStyled>
  );
};

export default BackButton;
