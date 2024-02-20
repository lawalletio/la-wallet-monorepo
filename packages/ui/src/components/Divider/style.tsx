import { styled } from 'styled-components';

import { DividerPrimitiveProps } from './types';

export const DividerPrimitive = styled.div<DividerPrimitiveProps>`
  width: 100%;

  min-height: ${(props) => props.$y}px;
`;
