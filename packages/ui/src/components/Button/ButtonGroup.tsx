'use client';

import React, { ReactNode } from 'react';
import { ButtonGroupStyle } from './style.js';

interface ComponentProps {
  children: ReactNode;
}

export function ButtonGroup(props: ComponentProps) {
  const { children } = props;

  return <ButtonGroupStyle>{children}</ButtonGroupStyle>;
}
