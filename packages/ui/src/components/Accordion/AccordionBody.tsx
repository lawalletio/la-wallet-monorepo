import React from 'react';

import { AccordionBodyProps } from './types';

import { AccordionBodyPrimitive } from './style';

export function AccordionBody(props: AccordionBodyProps) {
  const { children } = props;

  return <AccordionBodyPrimitive>{children}</AccordionBodyPrimitive>;
}
