import { InputGroup, InputGroupRight, InputWithLabel, Text } from '@/components/UI';
import { useTranslation } from '@/context/TranslateContext';
import { formatToPreference, useWalletContext } from '@lawallet/react';
import React from 'react';

const LimitInput = ({ amount, onChange }) => {
  const { t, lng } = useTranslation();
  const { settings, converter } = useWalletContext();

  return (
    <InputGroup>
      <InputWithLabel
        onChange={onChange}
        name="max-amount"
        label={t('MAX_AMOUNT')}
        placeholder="0"
        value={formatToPreference(
          settings.props.currency,
          converter.convertCurrency(amount, 'SAT', settings.props.currency),
          lng,
        )}
      />

      <InputGroupRight>
        <Text size="small">{settings.props.currency}</Text>
      </InputGroupRight>
    </InputGroup>
  );
};

export default LimitInput;
