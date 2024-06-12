'use client';

import { Divider } from '../../Divider';
import { Container } from '../Container';
import { StyledFooter } from './style';
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
