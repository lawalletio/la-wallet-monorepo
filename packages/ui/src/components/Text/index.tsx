import React from 'react';

import { TextProps } from './types.js';

import { TextPrimitive } from './style.js';

export function Text(props: TextProps): JSX.Element {
  const { children, size = 'normal', align = 'left', isBold = false, color } = props;

  return (
    <TextPrimitive $align={align} $color={color} $isBold={isBold} $isSmall={size === 'small'}>
      {children}
    </TextPrimitive>
  );
}
