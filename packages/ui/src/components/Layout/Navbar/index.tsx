'use client';
import React from 'react';
import { ReactNode } from 'react';
import { Flex } from '../../Flex';
import { Heading } from '../../Heading';
import { Container } from '../Container';
import { Left, NavbarStyled, Right } from './style';

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
