import { ReactNode } from 'react';

export interface FlexProps {
  children?: ReactNode;
  gap?: 0 | 2 | 4 | 8 | 16;
  direction?: 'row' | 'column';
  flex?: 0 | 1 | 'initial';
  justify?: 'start' | 'end' | 'space-between' | 'center';
  align?: 'start' | 'center' | 'end';
  // onClick?: (e: any) => void;
}

export interface FlexPrimitiveProps {
  customGap?: string;
  customDirection: 'row' | 'column';
  customFlex?: 0 | 1 | 'initial';
  customJustify?: 'start' | 'end' | 'space-between' | 'center';
  customAlign?: 'start' | 'center' | 'end';
}
