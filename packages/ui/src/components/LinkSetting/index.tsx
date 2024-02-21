import React from 'react';

import { Icon } from '../Icon';
import { CaretRightIcon } from '../Icons';

import { LinkSettingProps } from './types';

import { useTheme } from 'styled-components';
import { LinkSettingPrimitive } from './style';

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
