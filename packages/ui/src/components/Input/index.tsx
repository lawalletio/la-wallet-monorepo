import React from 'react';

import { CheckIcon, AlertIcon } from '../Icons';

import { InputProps } from './types';

import { theme } from '../../theme';
import { InputPrimitive, InputBox, InputIcon } from './style';

export function Input(props: InputProps) {
  const {
    placeholder,
    value,
    type = 'text',
    id = '',
    name = '',
    status,
    autoFocus = false,
    onChange,
    onFocus,
    onBlur,
    isLoading = false,
    isChecked = false,
    isError = false,
    disabled = false,
  } = props;

  return (
    <InputBox $withIcon={isLoading}>
      <InputPrimitive
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        type={type}
        id={id}
        name={name}
        value={value}
        $showValidate={!status}
        $isSuccess={status && status === 'success'}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      {(isLoading || isChecked || isError) && (
        <InputIcon>
          {/* {isLoading && <BtnLoader />} */}
          {isChecked && <CheckIcon color={theme.colors.success} />}
          {isError && <AlertIcon color={theme.colors.error} />}
        </InputIcon>
      )}
    </InputBox>
  );
}
