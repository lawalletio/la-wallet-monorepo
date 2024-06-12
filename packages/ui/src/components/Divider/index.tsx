import React from 'react';

import { DividerProps } from './types';

import { DividerPrimitive } from './style';

export function Divider(props: DividerProps): JSX.Element {
  const { y = 0 } = props;

  return <DividerPrimitive $y={y} />;
}
