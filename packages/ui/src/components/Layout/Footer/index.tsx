'use client';

import { Divider } from '../../Divider/index.js';
import { Container } from '../Container/index.js';
import { StyledFooter } from './style.js';
import React, { ReactNode } from 'react';

interface ComponentProps {
  children?: ReactNode;
}

export function Footer(props: ComponentProps) {
  const { children } = props;

  return (
    <StyledFooter>
      <Divider y={12} />
      <Container size="small">{children}</Container>
      <Divider y={24} />
    </StyledFooter>
  );
}
