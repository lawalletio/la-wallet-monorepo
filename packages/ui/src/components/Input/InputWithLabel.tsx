import React from 'react';

import { Label } from '../Label';
import { Flex } from '../Flex';

import { InputProps } from './types';
import { Input } from '.';

interface InputWithLabelProps extends InputProps {
  label: string;
  name: string;
}

export function InputWithLabel(props: InputWithLabelProps) {
  const { label, name, value = '' } = props;

  return (
    <Flex direction="column" gap={8}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} value={value} {...props} />
    </Flex>
  );
}
