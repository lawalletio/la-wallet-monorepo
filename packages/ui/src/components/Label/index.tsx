import React, { ReactNode } from 'react';

import { Text } from '../Text';

import { LabelPrimitive } from './style';

interface LabelProps {
  children: ReactNode;
  htmlFor: string;
}

export function Label(props: LabelProps) {
  const { children, htmlFor } = props;

  return (
    <LabelPrimitive htmlFor={htmlFor}>
      <Text size='small'>{children}</Text>
    </LabelPrimitive>
  );
}
