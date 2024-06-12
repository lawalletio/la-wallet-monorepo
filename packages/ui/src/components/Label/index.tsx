import React from 'react';

import { Text } from '../Text/index.js';

import { LabelProps } from './types.js';
import { LabelPrimitive } from './style.js';

export function Label(props: LabelProps) {
  const { children, htmlFor } = props;

  return (
    <LabelPrimitive htmlFor={htmlFor}>
      <Text size="small">{children}</Text>
    </LabelPrimitive>
  );
}
