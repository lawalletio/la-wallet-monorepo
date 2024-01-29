import { ReactNode } from 'react';

export interface LinkSettingProps {
  children: ReactNode;
  href: string;
  target?: '_self' | '_blank';
}
