import { ReactNode } from 'react';

export interface HeadingProps {
  children: ReactNode;
  as?: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

export interface HeadingPrimitiveProps {
  $align: 'left' | 'center' | 'right';
  $color?: string;
}
