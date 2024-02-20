import React from 'react';

import { IconsProps } from './types';

export function CaretRightIcon({ color = 'currentColor' }: IconsProps) {
  return (
    <>
      <svg fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          clipRule="evenodd"
          d="M9.399 4.328a.75.75 0 011.06 0l6.364 6.363a1.75 1.75 0 010 2.475L10.46 19.53a.75.75 0 01-1.06-1.06l6.364-6.364a.25.25 0 000-.354L9.399 5.388a.75.75 0 010-1.06z"
          fillRule="evenodd"
        />
      </svg>
    </>
  );
}
