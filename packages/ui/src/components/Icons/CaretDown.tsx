import React from 'react';

import { IconsProps } from './types';

export function CaretDownIcon({ color = 'currentColor' }: IconsProps) {
  return (
    <>
      <svg fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          clipRule="evenodd"
          d="M4.47 9.4a.75.75 0 011.06 0l6.364 6.364a.25.25 0 00.354 0L18.612 9.4a.75.75 0 011.06 1.06l-6.364 6.364a1.75 1.75 0 01-2.475 0L4.47 10.46a.75.75 0 010-1.06z"
          fillRule="evenodd"
        />
      </svg>
    </>
  );
}
