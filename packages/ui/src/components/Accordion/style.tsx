import { styled } from 'styled-components';

import { AccordionPrimitiveProps, AccordionContentProps, AccordionTriggerPrimitiveProps } from './types';

export const AccordionPrimitive = styled.div<AccordionPrimitiveProps>`
  width: 100%;

  background-color: ${(props) => (props.$isOpen ? props.theme.colors.gray15 : props.$background)};
  border: 1px solid ${(props) => (props.$isOpen ? props.theme.colors.gray35 : props.$borderColor)};
  border-radius: 8px;

  &:hover {
    border-color: ${(props) => (props.$isOpen ? props.theme.colors.gray35 : props.theme.colors.gray25)};
  }
`;

export const AccordionContent = styled.div<AccordionContentProps>`
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  flex-direction: column;
`;

export const AccordionItem = styled.div``;

export const AccordionTriggerPrimitive = styled.button<AccordionTriggerPrimitiveProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 60px;

  padding: 0 16px;

  background-color: transparent;
  border: none;
  border-bottom: 1px solid ${(props) => (props.$isOpen ? props.theme.colors.gray20 : 'transparent')};

  color: ${(props) => props.theme.colors.text};
  font-size: initial;
  text-align: left;

  cursor: pointer;

  span {
    flex: 1;
  }

  svg {
    color: ${(props) => (props.$isOpen ? props.theme.colors.text : props.theme.colors.gray25)};

    transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  }
`;

export const AccordionBodyPrimitive = styled.div`
  padding: 12px 16px;

  ul {
    li {
      padding: 12px 0;
      border-bottom: 1px solid ${(props) => props.theme.colors.gray20};

      &:last-child {
        border-bottom: none;
      }
    }
  }
`;
