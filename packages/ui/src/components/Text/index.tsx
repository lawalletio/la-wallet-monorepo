import React from 'react';

import { TextProps } from './types';

import { TextPrimitive } from './style';

export function Text(props: TextProps): JSX.Element {
  const { children, size = 'normal', align = 'left', isBold = false, color } = props;

  return (
    <TextPrimitive $isSmall={size === 'small'} $align={align} $isBold={isBold} $color={color}>
      {children}
    </TextPrimitive>
  );
}
