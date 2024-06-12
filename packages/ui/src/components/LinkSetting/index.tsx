import React from 'react';

import { Icon } from '../Icon/index.js';
import { CaretRightIcon } from '../Icons/index.js';

import { LinkSettingProps } from './types.js';

import { useTheme } from 'styled-components';
import { LinkSettingPrimitive } from './style.js';

export function LinkSetting(props: LinkSettingProps) {
  const { children, onClick } = props;
  const theme = useTheme();

  return (
    <LinkSettingPrimitive onClick={onClick}>
      {children}
      <Icon color={theme.colors.gray40} size="small">
        <CaretRightIcon />
      </Icon>
    </LinkSettingPrimitive>
  );
}
