import React, { ReactNode } from 'react';

import { InputGroupPrimitive } from './style.js';

interface InputGroupProps {
  children: ReactNode;
}

export function InputGroup(props: InputGroupProps) {
  const { children } = props;

  return <InputGroupPrimitive>{children}</InputGroupPrimitive>;
}
