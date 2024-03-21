'use client';
import { Button, Container, Flex } from '@lawallet/ui';
import React from 'react';

export const PruebaIndex = () => {
  return (
    <Container size="small">
      <Flex>
        <Button
          onClick={() => {
            alert('Probando 123456');
          }}
        >
          Click me
        </Button>
      </Flex>
    </Container>
  );
};
