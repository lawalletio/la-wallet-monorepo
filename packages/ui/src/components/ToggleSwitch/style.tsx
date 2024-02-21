import { baseTheme } from '../../theme';
import { styled } from 'styled-components';

export const ToggleSwitchPrimitive = styled.div`
  max-width: 44px;

  input[type='checkbox'] {
    position: absolute;
    visibility: hidden;
    z-index: 0;

    height: 0;
    width: 0;
  }

  label {
    position: relative;

    display: block;
    min-width: 44px;
    height: 24px;

    background: ${(props) => props.theme.colors.gray30};
    border-radius: 100px;

    text-indent: -9999px;

    cursor: pointer;

    &:after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;

      width: 20px;
      height: 20px;

      background: ${(props) => props.theme.colors.white};
      border-radius: 90px;

      transition: 0.3s;
    }

    &:active::after {
      width: 20px;
    }
  }

  input:checked + label {
    background: ${(props) => props.theme.colors.primary};
  }

  input:checked + label:after {
    left: calc(100% - 2px);
    transform: translateX(-100%);
  }
`;
