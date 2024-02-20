import React, { useState, useEffect } from 'react';

// import { Icon } from '../Icon';
// import { CaretDownIcon } from '../Icons';

import { AccordionTriggerProps } from './types';

import { AccordionTriggerPrimitive } from './style';

export function AccordionTrigger(props: AccordionTriggerProps) {
  const { children, onClick, isOpen } = props;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClick = () => {
    onClick();
  };

  return (
    <AccordionTriggerPrimitive $isOpen={open} onClick={handleClick}>
      {children}
      {/* <Icon size='small'>
        <CaretDownIcon />
      </Icon> */}
    </AccordionTriggerPrimitive>
  );
}
