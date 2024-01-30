import React from 'react';

import { FlexProps } from './types';
import { FlexPrimitive } from './style';

export function Flex(props: FlexProps): JSX.Element {
  const { children, gap = 0, onClick, direction = 'row', flex = 'initial', justify = 'start', align = 'start' } = props;

  return (
    <FlexPrimitive
      $customGap={`${gap}px`}
      $customDirection={direction}
      $customFlex={flex}
      $customJustify={justify}
      $customAlign={align}
      onClick={onClick}
    >
      {children}
    </FlexPrimitive>
  );
}
