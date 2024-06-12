import React, { ReactNode } from 'react';
import { CardStyle } from './style.js';

export function Card({ children }: { children: ReactNode }) {
  return <CardStyle>{children}</CardStyle>;
}
