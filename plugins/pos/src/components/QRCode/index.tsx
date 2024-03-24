'use client';
import React from 'react';
import { QRCode as QRStyled } from './style';
import { useTheme } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';

interface ComponentProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 250 }: ComponentProps) {
  const theme = useTheme();
  return (
    <QRStyled $isSmall={false}>
      <QRCodeSVG value={value} size={size} fgColor={theme.colors.black} bgColor={theme.colors.white} />
    </QRStyled>
  );
}
