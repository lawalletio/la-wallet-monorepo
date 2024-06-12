import React from 'react';

import { AccordionBodyProps } from './types.js';

import { AccordionBodyPrimitive } from './style.js';

export function AccordionBody(props: AccordionBodyProps) {
  const { children } = props;

  return <AccordionBodyPrimitive>{children}</AccordionBodyPrimitive>;
}
