import React, { ReactNode } from 'react';
import { CardStyle } from './style';

export function Card({ children }: { children: ReactNode }) {
  return <CardStyle>{children}</CardStyle>;
}
