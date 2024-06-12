import React from 'react';

import { TextareaProps } from './types';

import { TextareaPrimitive } from './style';

export function Textarea(props: TextareaProps) {
  const { placeholder, status, onChange, id = '', name = '', value, disabled = false } = props;

  return (
    <TextareaPrimitive
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
