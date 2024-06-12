import React from 'react';

import { HeadingProps } from './types.js';

import { HeadingBox, HeadingPrimitive } from './style.js';

export function Heading(props: HeadingProps): JSX.Element {
  const { children, as = 'h1', align = 'left', color } = props;

  return (
    <HeadingBox>
      <HeadingPrimitive $align={align} $color={color} as={as}>
        {children}
      </HeadingPrimitive>
    </HeadingBox>
  );
}
