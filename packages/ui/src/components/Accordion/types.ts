import { ReactNode } from 'react';

export interface AccordionProps {
  children?: ReactNode;
  trigger: ReactNode;
  onOpen?: () => void;
  variant?: 'filled' | 'borderless';
}

export interface AccordionTriggerProps {
  children: ReactNode;
  onClick: () => void;
  isOpen: boolean;
}

export interface AccordionBodyProps {
  children: ReactNode;
}

export interface AccordionPrimitiveProps {
  $isOpen: boolean;
  $background: string;
  $borderColor: string;
}

export interface AccordionContentProps {
  $isOpen: boolean;
}

export interface AccordionTriggerPrimitiveProps {
  $isOpen: boolean;
}
