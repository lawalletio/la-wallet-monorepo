import React from 'react';

import { ContainerProps } from './types.js';

import { ContainerPrimitive } from './style.js';

export function Container(props: ContainerProps): JSX.Element {
  const { children, size = 'medium' } = props;

  return <ContainerPrimitive $isSmall={size === 'small'}>{children}</ContainerPrimitive>;
}
