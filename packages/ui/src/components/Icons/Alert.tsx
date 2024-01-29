import React from 'react';

export function AlertIcon({ color = 'currentColor' }) {
  return (
    <>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill={color}>
        <circle cx='12' cy='16.75' r='1.25'></circle>
        <path d='M11 6h2v8h-2z'></path>
      </svg>
    </>
  );
}
