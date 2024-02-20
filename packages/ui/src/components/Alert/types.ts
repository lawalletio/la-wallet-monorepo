export interface AlertProps {
  title?: string;
  description: string;
  type?: 'success' | 'warning' | 'error';
  isOpen?: boolean;
}

export interface AlertPrimitiveProps {
  $background?: string;
  $color?: string;
  $isOpen: boolean;
}
