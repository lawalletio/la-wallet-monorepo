import { styled } from 'styled-components';
import { FlexPrimitiveProps } from './types.js';

export const FlexPrimitive = styled.div<FlexPrimitiveProps>`
  position: relative;

  display: flex;
  flex-direction: ${(props) => props.$customDirection};
  gap: ${(props) => props.$customGap};
  flex: ${(props) => props.$customFlex};
  justify-content: ${(props) => props.$customJustify};
  align-items: ${(props) => props.$customAlign};
  width: 100%;
`;
