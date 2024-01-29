import { ReactNode } from 'react';

export interface TextProps {
  children: ReactNode;
  size?: 'small' | 'normal';
  align?: 'left' | 'center' | 'right';
  isBold?: boolean;
  color?: string;
}

export interface TextPrimitiveProps {
  $isSmall?: boolean;
  $isBold?: boolean;
  $align?: string;
  $color?: string;
}
