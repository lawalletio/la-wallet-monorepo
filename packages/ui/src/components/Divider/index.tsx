import React from 'react';

import { DividerProps } from './types.js';

import { DividerPrimitive } from './style.js';

export function Divider(props: DividerProps): JSX.Element {
  const { y = 0 } = props;

  return <DividerPrimitive $y={y} />;
}
