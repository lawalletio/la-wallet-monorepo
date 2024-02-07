import React, { FC } from 'react';

import { ButtonProps } from './types';

import { theme } from '../../theme';
import { BaseButton } from './style';

export const Button: FC<ButtonProps> = ({
  children,
  color = 'primary',
  variant = 'filled',
  size = 'normal',
  loading = false,
  disabled = false,
  ...props
}): JSX.Element => {
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
    <BaseButton
      $background={backgroundColor}
      $color={textColor}
      $isSmall={size === 'small'}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </BaseButton>
  );
};
