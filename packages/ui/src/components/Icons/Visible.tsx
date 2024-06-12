import React from 'react';

import { IconsProps } from './types.js';

export function VisibleIcon({ color = 'currentColor' }: IconsProps) {
  return (
    <>
      <svg fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
        <path
          clipRule="evenodd"
          d="M21 12c0 2.761-4.03 5-9 5s-9-2.239-9-5 4.03-5 9-5 9 2.239 9 5zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          fillRule="evenodd"
        />
      </svg>
    </>
  );
}
