import { styled } from 'styled-components';
import { AlertPrimitiveProps } from './types';

export const AlertPrimitive = styled.div<AlertPrimitiveProps>`
  position: absolute;
  top: 40px;
  right: 0;
  left: 0;
  z-index: ${(props) => (props.$isOpen ? 15 : -1)};
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transform: ${(props) => (props.$isOpen ? 'translateY(-20px)' : 'translateY(0px)')};
  transition-duration: 0.3s;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  height: 60px;

  padding: 0 20px;

  .box {
    position: relative;
    overflow: hidden;

    display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 300px;
    height: auto;

    padding: 12px;
    padding-bottom: 18px;

    background-color: ${(props) => props.theme.colors.text};
    box-shadow: 0 18px 40px 4px ${(props) => props.$background};
    border-radius: 4px;

    color: ${(props) => props.theme.colors.background};

    > div {
      &:first-child {
        min-width: 24px;
        min-height: 24px;

        background-color: ${(props) => props.$color};
        border-radius: 24px;

        color: ${(props) => props.theme.colors.text};
      }

      &:last-child {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
    }
  }

  .progress {
    position: absolute;
    bottom: 0;
    left: 0;

    width: 100%;
    height: 6px;

    background-color: ${(props) => props.$color};

    transition: width 3s;
  }
`;
