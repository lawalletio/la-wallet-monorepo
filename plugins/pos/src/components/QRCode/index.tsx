'use client';
import React from 'react';
import ReactQRCode from 'react-qr-code';
import { QRCode as QRStyled } from './style';
import { useTheme } from 'styled-components';

interface ComponentProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 250 }: ComponentProps) {
  const theme = useTheme();
  return (
    <QRStyled $isSmall={false}>
      <ReactQRCode value={value} size={size} fgColor={theme.colors.black} bgColor={theme.colors.white} />
    </QRStyled>
  );
}
