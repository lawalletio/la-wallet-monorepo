import { styled } from 'styled-components';

import { FlexPrimitiveProps } from './types';

export const FlexPrimitive = styled.div<FlexPrimitiveProps>`
  position: relative;

  display: flex;
  flex-direction: ${(props) => props.$direction};
  gap: ${(props) => props.$gap};
  flex: ${(props) => props.$flex};
  justify-content: ${(props) => props.$justify};
  align-items: ${(props) => props.$align};
  width: 100%;
`;
