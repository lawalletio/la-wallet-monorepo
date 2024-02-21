'use client';

import { appTheme } from '@/config';
import { styled } from 'styled-components';

interface NavbarProps {}

export const Navbar = styled.div<NavbarProps>`
  height: 60px;
  position: relative;
  z-index: 10;
  background-color: ${appTheme.colors.background};
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;

  background-color: transparent;
  border: none;

  color: ${appTheme.colors.primary};

  cursor: pointer;
`;

const BoxIcons = styled.div`
  width: 70px;
`;

export const Left = styled(BoxIcons)``;

export const Right = styled(BoxIcons)``;
