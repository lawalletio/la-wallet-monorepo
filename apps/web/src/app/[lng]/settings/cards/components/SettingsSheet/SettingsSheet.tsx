import { useTranslation } from '@/context/TranslateContext';
import { ActionSheet, Button, LinkButton } from '@lawallet/ui';
import React, { useState } from 'react';
import { CardProps } from '../DebitCard';
import TransferSheet from './TransferSheet';

export type SettingsSheetProps = { isOpen: boolean; card: CardProps; onClose: () => void };

const SettingsSheet = ({ card, onClose, isOpen }: SettingsSheetProps) => {
  const { t } = useTranslation();
  const [showTransfer, setShowTransfer] = useState(false);

  const handleShowTransfer = () => {
    setShowTransfer(true);
  };

  return (
    <React.Fragment>
      <ActionSheet
        isOpen={isOpen}
        onClose={onClose}
        title={card.config?.name || card.data.design.name}
        description={card.config?.description || card.data.design.name}
        cancelText={t('CANCEL')}
      >
        <LinkButton variant="bezeledGray" href={`/settings/cards/${card?.uuid}`}>
          {t('SETTINGS')}
        </LinkButton>
        <Button variant="bezeledGray" onClick={handleShowTransfer}>
          {t('TRANSFER')}
        </Button>
      </ActionSheet>

      <TransferSheet
        isOpen={showTransfer}
        card={card}
        onClose={() => {
          setShowTransfer(false);
          onClose();
        }}
      />
    </React.Fragment>
  );
};

export default SettingsSheet;
