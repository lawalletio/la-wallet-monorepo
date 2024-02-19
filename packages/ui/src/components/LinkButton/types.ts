import { ReactNode } from 'react';

type Color = 'primary' | 'secondary' | 'error';
type Variant = 'filled' | 'bezeled' | 'bezeledGray' | 'borderless';
type Size = 'small' | 'normal';

export interface LinkButtonProps {
  children: ReactNode;
  color?: Color;
  variant?: Variant;
  size?: Size;
  // disabled?: boolean;
  componentName?: string;
  tabIndex?: number;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export interface LinkButtonPrimitiveProps {
  $background?: string;
  $color?: string;
  $isSmall?: boolean;
}
