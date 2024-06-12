import React from 'react';

import { ButtonSettingProps } from './types';

import { ButtonSettingPrimitive } from './style';

export function ButtonSetting(props: ButtonSettingProps) {
  const { children, onClick } = props;

  return <ButtonSettingPrimitive onClick={onClick}>{children}</ButtonSettingPrimitive>;
}
