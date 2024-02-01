import { ReactNode } from 'react';

export interface CardAlertProps {
  title: string;
  description: ReactNode;
  isHome?: boolean;
}
