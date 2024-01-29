import React from 'react';

import { ContainerProps } from './types';

import { ContainerPrimitive } from './style';

export function Container(props: ContainerProps): JSX.Element {
  const { children, size = 'medium' } = props;

  return <ContainerPrimitive $isSmall={size === 'small'}>{children}</ContainerPrimitive>;
}
