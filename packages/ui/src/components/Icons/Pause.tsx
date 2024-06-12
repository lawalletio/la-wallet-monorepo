import React from 'react';

import { IconsProps } from './types';

export function PauseIcon({ color = 'currentColor' }: IconsProps) {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 17.6001L16 6.4001" stroke={color} strokeLinecap="round" strokeWidth="1.5" />
      <path d="M8 17.6001L7.99999 6.39986" stroke={color} strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
