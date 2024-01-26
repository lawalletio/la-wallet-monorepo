'use client';

import Label from '../Label';
import Flex from '../Flex';
import Input from './';

interface InputWithLabelProps {
  label: string;
  name: string;
  placeholder: string;
  status?: 'success' | 'error';
  isError?: boolean;
  type?: 'text' | 'password' | 'number';
  value?: string;
  onChange?: (e: any) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
}

export default function Component(props: InputWithLabelProps) {
  const { label, name, isError = false, status = undefined, value = '' } = props;

  return (
    <Flex direction="column" gap={8}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} isError={isError} status={isError ? 'error' : status} value={value} {...props} />
    </Flex>
  );
}
