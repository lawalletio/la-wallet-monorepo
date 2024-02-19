import { ReactNode } from 'react';

export interface LinkSettingProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}
