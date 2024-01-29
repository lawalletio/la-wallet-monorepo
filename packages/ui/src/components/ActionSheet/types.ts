import { ReactNode } from 'react';

export interface ActionSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description: string;
  cancelText: string;
}

export interface ActionSheetPrimitiveProps {
  $isOpen?: boolean;
}
