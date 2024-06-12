import { styled } from 'styled-components';

import { ContainerPrimitiveProps } from './types';

export const ContainerPrimitive = styled.div<ContainerPrimitiveProps>`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  max-width: ${(props) => (props.$isSmall ? '450px' : '700px')};

  margin: 0 auto;
  padding: 0 0.8em;
`;
