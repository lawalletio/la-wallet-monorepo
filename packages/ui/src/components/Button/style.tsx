import { styled } from 'styled-components';

import { BaseButtonProps, ButtonCustomProps } from './types.js';

export const BaseButton = styled.button<BaseButtonProps>`
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

  svg {
    width: 18px;

    color: ${(props) => props.$color};
  }

  &:disabled {
    background-color: transparent;
    color: ${(props) => props.theme.colors.gray50};
    cursor: not-allowed;
  }

  &:not(:disabled) {
    &:hover {
      opacity: 0.85;
    }

    &:active {
      opacity: 0.65;
    }
  }
`;

export const ButtonCustom = styled.button<ButtonCustomProps>`
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

  svg {
    width: 18px;

    color: ${(props) => props.$color};
  }

  &:not(:disabled) {
    &:hover {
      opacity: 0.85;
    }

    &:active {
      opacity: 0.65;
    }
  }

  &:disabled {
    background-color: ${(props) => props.theme.colors.gray40};
    cursor: not-allowed;
  }
`;

export const ButtonGroupStyle = styled.div`
  display: flex;
  gap: 8px;

  padding: 4px;

  background-color: ${(props) => props.theme.colors.gray15};
  border-radius: 24px;
`;
