import { ReactNode } from 'react';

export interface ContainerProps {
  children: ReactNode;
  size?: 'small' | 'medium';
}

export interface ContainerPrimitiveProps {
  $isSmall?: boolean;
}
