import { styled } from 'styled-components';

import { BannerAlertPrimitiveProps } from './types';

export const BannerAlertPrimitive = styled.div<BannerAlertPrimitiveProps>`
  position: relative;
  overflow: hidden;

  width: 100%;

  padding: 24px 32px;

  background-color: ${(props) => props.theme.colors.gray15};
  border: 1px solid ${(props) => props.theme.colors.gray20};
  border-radius: 24px;

  color: ${(props) => props.theme.colors.text};
  text-decoration: none;

  > div {
    &:first-child {
      position: relative;
      z-index: 1;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;

      h6 {
        color: ${(props) => props.$color};
      }

      > div {
        &:first-child {
          max-width: 250px;
        }
      }
    }
  }
`;

export const Asset = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.65;
  height: 100%;

  &:before {
    content: '';

    position: absolute;
    top: 0;
    right: 0;

    width: 100%;
    height: 100%;

    background: linear-gradient(to left, rgba(38, 38, 38, 0.65), ${(props) => props.theme.colors.gray15});
  }

  img {
    width: 100%;
    height: 100%;
  }
`;
