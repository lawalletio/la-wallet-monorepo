import { styled } from 'styled-components';

import { IconPrimitiveProps } from './types';

export const IconPrimitive = styled.div<IconPrimitiveProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: ${(props) => (props.$isSmall ? '18px' : '24px')};
  min-height: ${(props) => (props.$isSmall ? '18px' : '24px')};
  width: ${(props) => (props.$isSmall ? '18px' : '24px')};
  height: ${(props) => (props.$isSmall ? '18px' : '24px')};

  svg,
  img {
    width: 100%;
    height: 100%;

    color: ${(props) => props.$color};
  }
`;
