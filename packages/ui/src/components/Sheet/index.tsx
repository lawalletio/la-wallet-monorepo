import React, { useState, useEffect } from 'react';

import { Container } from '../Layout/Container';
import { Flex } from '../Flex';
import { Button } from '../Button';
import { Heading } from '../Heading';

import { SheetProps } from './types';

import { SheetPrimitive, SheetContent, SheetBody } from './style';

export function Sheet(props: SheetProps) {
  const { children, isOpen, onClose, title } = props;

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
            <Flex align='center' justify='space-between'>
              <Heading as='h6'>{title}</Heading>
              <Button variant='borderless' size='small' onClick={handleClose}>
                Cerrar
              </Button>
            </Flex>
          </Container>
        </Flex>
        <SheetBody>{children}</SheetBody>
      </SheetContent>
    </SheetPrimitive>
  );
}
