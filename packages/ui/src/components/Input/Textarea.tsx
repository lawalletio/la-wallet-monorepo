import React from 'react';

import { TextareaProps } from './types';

import { TextareaPrimitive } from './style';

export function Textarea(props: TextareaProps) {
  const { placeholder, status, onChange, id = '', name = '', value, disabled = false } = props;

  return (
    <TextareaPrimitive
      name={name}
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      $showValidate={!status}
      $isSuccess={status && status === 'success'}
    ></TextareaPrimitive>
  );
}
