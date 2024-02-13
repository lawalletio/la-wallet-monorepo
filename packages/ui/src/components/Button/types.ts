import { ReactNode, CSSProperties, ButtonHTMLAttributes, ReactElement } from 'react';

type Color = 'primary' | 'secondary' | 'error';
type Variant = 'filled' | 'bezeled' | 'bezeledGray' | 'borderless';
type Size = 'small' | 'normal';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: Color;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  componentName?: string;
  tabIndex?: number;
  style?: CSSProperties;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  explicitLoader?: ReactElement;
}

export interface BaseButtonProps {
  $background?: string;
  $color?: string;
  $isSmall?: boolean;
}

export interface ButtonCustomProps {
  $background?: string;
  $color?: string;
  $isSmall?: boolean;
}
