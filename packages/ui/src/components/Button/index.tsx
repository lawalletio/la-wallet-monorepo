import React, { FC } from 'react';
import { ButtonProps } from './types.js';

import { BaseButton } from './style.js';
import { BtnLoader } from '../Loader/Loader.js';
import { useTheme } from 'styled-components';

export const Button: FC<ButtonProps> = ({
  children,
  color = 'primary',
  variant = 'filled',
  size = 'normal',
  loading = false,
  disabled = false,
  explicitLoader = <BtnLoader />,
  ...props
}): JSX.Element => {
  const theme = useTheme();
  let backgroundColor: string = 'transparent';
  let textColor: string = theme.colors.text;

  switch (variant) {
    case 'filled':
      backgroundColor = theme.colors[color];
      textColor = theme.colors.background;
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
      {loading ? explicitLoader : children}
    </BaseButton>
  );
};
