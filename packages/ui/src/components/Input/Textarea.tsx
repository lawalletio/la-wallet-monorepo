import React from 'react';
import { useTheme } from 'styled-components';

import { TextareaProps } from './types.js';

import { TextareaPrimitive } from './style.js';

export function Textarea(props: TextareaProps) {
  const { placeholder, status, onChange, id = '', name = '', value, disabled = false } = props;
  const theme = useTheme();

  return (
    <TextareaPrimitive
      $background={theme.colors.gray20}
      $isSuccess={status && status === 'success'}
      $showValidate={!status}
      disabled={disabled}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
