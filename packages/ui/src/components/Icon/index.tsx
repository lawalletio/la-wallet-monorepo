import React from 'react';

import { IconProps } from './types.js';

import { IconPrimitive } from './style.js';

export function Icon(props: IconProps) {
  const { children, size = 'normal', color = 'currentColor' } = props;

  const isSmall = size === 'small';

  return (
    <IconPrimitive $color={color} $isSmall={isSmall}>
      {children}
    </IconPrimitive>
  );
}
