import React from 'react';

import { IconsProps } from './types';

export function PlayIcon({ color = 'currentColor' }: IconsProps) {
  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 19.1997L8.01001 4.96855"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M8.01001 4.79971L19.2102 11.9997L8.01001 19.1997"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
