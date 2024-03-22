'use client';
import { styled } from 'styled-components';

interface NavbarProps {}

export const NavbarStyled = styled.div<NavbarProps>`
  height: 60px;
  position: relative;
  z-index: 10;
  background-color: ${(props) => props.theme.colors.background};
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;

  background-color: transparent;
  border: none;

  color: ${(props) => props.theme.colors.primary};

  cursor: pointer;
`;

const BoxIcons = styled.div`
  width: 70px;
`;

export const Left = styled(BoxIcons)``;

export const Right = styled(BoxIcons)``;
