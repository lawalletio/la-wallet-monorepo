import React from 'react';

import { Text } from '../Text';

import { LabelProps } from './types';
import { LabelPrimitive } from './style';

export function Label(props: LabelProps) {
  const { children, htmlFor } = props;

  return (
    <LabelPrimitive htmlFor={htmlFor}>
      <Text size="small">{children}</Text>
    </LabelPrimitive>
  );
}
