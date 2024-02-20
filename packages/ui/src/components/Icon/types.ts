import { ReactNode } from 'react';

export interface IconProps {
  children: ReactNode;
  size?: 'small' | 'normal';
  color?: string;
}

export interface IconPrimitiveProps {
  $isSmall: boolean;
  $color: string;
}
