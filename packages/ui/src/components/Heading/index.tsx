import React from 'react';

import { HeadingProps } from './types';

import { HeadingBox, HeadingPrimitive } from './style';

export function Heading(props: HeadingProps): JSX.Element {
  const { children, as = 'h1', align = 'left', color } = props;

  return (
    <HeadingBox>
      <HeadingPrimitive as={as} $align={align} $color={color}>
        {children}
      </HeadingPrimitive>
    </HeadingBox>
  );
}
