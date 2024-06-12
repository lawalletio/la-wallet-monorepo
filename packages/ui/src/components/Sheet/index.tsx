import React, { useState, useEffect } from 'react';

import { Container } from '../Layout/Container/index.js';
import { Flex } from '../Flex/index.js';
import { Button } from '../Button/index.js';
import { Heading } from '../Heading/index.js';

import { SheetProps } from './types.js';

import { SheetPrimitive, SheetContent, SheetBody } from './style.js';

export function Sheet(props: SheetProps) {
  const { children, isOpen, closeText = 'Close', onClose, title } = props;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <SheetPrimitive $isOpen={open}>
      <SheetContent $isOpen={open}>
        <Flex>
          <Container>
            <Flex align="center" justify="space-between">
              <Heading as="h6">{title}</Heading>
              <Button size="small" variant="borderless" onClick={handleClose}>
                {closeText}
              </Button>
            </Flex>
          </Container>
        </Flex>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </SheetPrimitive>
  );
}
