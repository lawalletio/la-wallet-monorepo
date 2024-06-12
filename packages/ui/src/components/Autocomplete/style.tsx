import { styled } from 'styled-components';

import { AutocompletePrimitiveProps } from './types';

export const AutocompletePrimitive = styled.div<AutocompletePrimitiveProps>`
  width: 100%;
`;

export const AutocompleteContent = styled.div`
  position: absolute;
  top: 100%;
  z-index: 1;

  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  padding: 4px;
  margin-top: 4px;

  background-color: ${(props) => props.theme.colors.gray20};
  border: 1px solid ${(props) => props.theme.colors.gray25};
  border-radius: 12px;

  box-shadow: 0px 8px 12px 0px rgba(28, 28, 28, 0.48);

  button {
    padding: 12px;

    background-color: transparent;
    border-radius: 8px;
    border: none;

    color: ${(props) => props.theme.colors.text};

    cursor: pointer;

    &:hover {
      background-color: ${(props) => props.theme.colors.gray15};
    }

    &:focus {
      background-color: ${(props) => props.theme.colors.gray10};
    }

    &:active {
      background-color: ${(props) => props.theme.colors.primary15};
    }
  }

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;

    font-size: 14px;
  }
`;

export const AutocompleteItem = styled.button`
  background-color: transparent;
  border: none;

  font-size: inherit;
`;
