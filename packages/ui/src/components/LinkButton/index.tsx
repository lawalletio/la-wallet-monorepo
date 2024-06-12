import React from 'react';

import { LinkButtonProps } from './types';
import { LinkButtonPrimitive } from './style';
import { useTheme } from 'styled-components';

export function LinkButton(props: LinkButtonProps) {
  const {
    children,
    color = 'primary',
    variant = 'filled',
    size = 'normal',
    // disabled = false,
    tabIndex = 0,
    onClick,
  } = props;

  const theme = useTheme();

  let backgroundColor: string = 'transparent';
  let textColor: string = theme.colors.text;

  switch (variant) {
    case 'filled':
      backgroundColor = theme.colors[color];
      textColor = theme.colors.black;
      break;
    case 'bezeled':
      backgroundColor = theme.colors[`${color}15`];
      textColor = theme.colors[color];
      break;
    case 'bezeledGray':
      backgroundColor = theme.colors.gray15;
      textColor = theme.colors[color];
      break;
    case 'borderless':
      backgroundColor = 'transparent';
      textColor = theme.colors[color];
      break;
  }

  return (
    <LinkButtonPrimitive
      $background={backgroundColor}
      $color={textColor}
      tabIndex={tabIndex}
      onClick={onClick}
      $isSmall={size === 'small'}
    >
      {children}
    </LinkButtonPrimitive>
  );
}
