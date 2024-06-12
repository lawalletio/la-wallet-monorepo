import React, { ReactNode } from 'react';
import { InputGroupRightPrimitive } from './style';

interface InputGroupRightProps {
  children: ReactNode;
}

export function InputGroupRight(props: InputGroupRightProps) {
  const { children } = props;

  return <InputGroupRightPrimitive>{children}</InputGroupRightPrimitive>;
}
