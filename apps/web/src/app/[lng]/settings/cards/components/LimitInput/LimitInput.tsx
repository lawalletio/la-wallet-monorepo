import { InputGroup, InputGroupRight, InputWithLabel, Text } from '@/components/UI';
import { useTranslation } from '@/context/TranslateContext';
import { useWalletContext } from '@lawallet/react';
import React from 'react';

const LimitInput = ({ amount, onChange }) => {
  const { t } = useTranslation();
  const { settings, converter } = useWalletContext();

  return (
    <InputGroup>
      <InputWithLabel
        onChange={onChange}
        type="number"
        name="max-amount"
        label={t('MAX_AMOUNT')}
        placeholder="0"
        value={String(converter.convertCurrency(amount, 'SAT', settings.props.currency))}
      />

      <InputGroupRight>
        <Text size="small">{settings.props.currency}</Text>
      </InputGroupRight>
    </InputGroup>
  );
};

export default LimitInput;
