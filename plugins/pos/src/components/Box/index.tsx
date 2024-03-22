import React from 'react';
import { styled } from 'styled-components';

interface CardProps {
  $color: 'primary' | 'secondary' | 'error';
}

const BoxStyle = styled.div<CardProps>`
  width: 100%;
  height: 200px;

  padding: 8px 16px;

  background-color: ${(props) => props.theme.colors[props.$color]};
  border-radius: 12px;

  a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;

    color: ${(props) => props.theme.colors.black};
    text-decoration: none;

    > div {
      &:first-child {
        width: 50px;
        height: 50px;

        background-color: ${(props) => props.theme.colors.white};
        border-radius: 50px;

        svg {
          width: 24px;
          height: 24px;
        }
      }
    }
  }
`;

interface ComponentProps {
  children: any;
  color?: 'primary' | 'secondary' | 'error';
}

export function Box(props: ComponentProps) {
  const { children, color = 'primary' } = props;

  return <BoxStyle $color={color}>{children}</BoxStyle>;
}
