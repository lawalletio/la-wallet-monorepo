import { styled } from 'styled-components';

import { LinkButtonPrimitiveProps } from './types';

export const LinkButtonPrimitive = styled.div<LinkButtonPrimitiveProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: ${(props) => (props.$isSmall ? 'inherit' : 1)};
  min-width: ${(props) => (props.$isSmall ? '40px' : '50px')};
  min-height: ${(props) => (props.$isSmall ? '40px' : '50px')};

  padding: ${(props) => (props.$isSmall ? '4px 8px' : '12px 8px')};

  border: none;
  border-radius: ${(props) => props.theme.borders.buttonRadius};
  background-color: ${(props) => props.$background};

  color: ${(props) => props.$color};
  font-size: ${(props) => (props.$isSmall ? '.7em' : '.8em')};
  font-weight: 700;
  text-align: center;

  cursor: pointer;
  text-decoration: none;

  svg {
    width: 18px;

    color: ${(props) => props.$color};
  }

  &:hover {
    opacity: 0.85;
  }

  &:active {
    opacity: 0.65;
  }
`;
