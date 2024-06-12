import { styled } from 'styled-components';

import { TextPrimitiveProps } from './types';

export const TextPrimitive = styled.p<TextPrimitiveProps>`
  color: ${(props) => props.$color};
  font-size: ${(props) => (props.$isSmall ? '.7rem' : '.8rem')};
  line-height: ${(props) => (props.$isSmall ? '.9rem' : '1rem')};
  text-align: ${(props) => props.$align};
  font-weight: ${(props) => (props.$isBold ? 700 : 400)};
`;
