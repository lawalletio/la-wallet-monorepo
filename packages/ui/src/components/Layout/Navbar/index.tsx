'use client';
import React from 'react';
import { ReactNode } from 'react';
import { Flex } from '../../Flex/index.js';
import { Heading } from '../../Heading/index.js';
import { Container } from '../Container/index.js';
import { Left, NavbarStyled, Right } from './style.js';

interface ComponentProps {
  children?: ReactNode;
  title?: string;
  leftButton?: ReactNode;
  rightButton?: ReactNode;
}

export function Navbar(props: ComponentProps) {
  const { children, title, leftButton, rightButton } = props;

  return (
    <NavbarStyled>
      <Container>
        <Flex flex={1} align="center" gap={8}>
          {leftButton && <Left>{leftButton}</Left>}

          {title ? (
            <Flex justify="center">
              <Heading as="h5">{title}</Heading>
            </Flex>
          ) : (
            children
          )}

          {rightButton ? <Right>{rightButton}</Right> : !children ? <Right /> : null}
        </Flex>
      </Container>
    </NavbarStyled>
  );
}
