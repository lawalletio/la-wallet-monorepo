import React, { ReactNode } from 'react';

import { InputGroupPrimitive } from './style';

interface InputGroupProps {
  children: ReactNode;
}

export function InputGroup(props: InputGroupProps) {
  const { children } = props;

  return <InputGroupPrimitive>{children}</InputGroupPrimitive>;
}
