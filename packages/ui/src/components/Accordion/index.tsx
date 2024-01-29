import React, { useState } from 'react';

import { AccordionTrigger } from './AccordionTrigger';

import { AccordionProps } from './types';

import { theme } from '../../theme';
import { AccordionPrimitive, AccordionContent } from './style';

export function Accordion(props: AccordionProps) {
  const { children, trigger, onOpen, variant = 'filled' } = props;

  const [open, setOpen] = useState(false);

  let backgroundColor: string = 'transparent';
  let textColor: string = theme.colors.text;

  switch (variant) {
    case 'filled':
      backgroundColor = theme.colors.gray15;
      textColor = theme.colors.gray20;
      break;
    case 'borderless':
      backgroundColor = 'transparent';
      textColor = 'transparent';
      break;
  }

  const handleClick = () => {
    if (!open && onOpen) onOpen();
    setOpen(!open);
  };

  return (
    <AccordionPrimitive $isOpen={open} $background={backgroundColor} $borderColor={textColor}>
      <AccordionTrigger onClick={handleClick} isOpen={open}>
        {trigger}
      </AccordionTrigger>
      <AccordionContent $isOpen={open}>{children}</AccordionContent>
    </AccordionPrimitive>
  );
}
