import React from 'react';

export function AlertIcon({ color = 'currentColor' }) {
  return (
    <>
      <svg fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="16.75" r="1.25" />
        <path d="M11 6h2v8h-2z" />
      </svg>
    </>
  );
}
