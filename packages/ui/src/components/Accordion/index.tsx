import React, { useState } from 'react';

import { AccordionTrigger } from './AccordionTrigger';

import { AccordionProps } from './types';

import { useTheme } from 'styled-components';
import { AccordionContent, AccordionPrimitive } from './style';

export function Accordion(props: AccordionProps) {
  const { children, trigger, onOpen, variant = 'filled' } = props;

  const [open, setOpen] = useState(false);
  const theme = useTheme();

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
    <AccordionPrimitive $background={backgroundColor} $borderColor={textColor} $isOpen={open}>
      <AccordionTrigger isOpen={open} onClick={handleClick}>
        {trigger}
      </AccordionTrigger>
      <AccordionContent $isOpen={open}>{children}</AccordionContent>
    </AccordionPrimitive>
  );
}
