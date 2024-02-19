import React from 'react';

import { Icon } from '../Icon';
import { CaretRightIcon } from '../Icons';

import { LinkSettingProps } from './types';

import { theme } from '../../theme';
import { LinkSettingPrimitive } from './style';

export function LinkSetting(props: LinkSettingProps) {
  const { children, onClick } = props;

  return (
    <LinkSettingPrimitive onClick={onClick}>
      {children}
      <Icon color={theme.colors.gray40} size="small">
        <CaretRightIcon />
      </Icon>
    </LinkSettingPrimitive>
  );
}
