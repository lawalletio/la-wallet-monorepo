import React from 'react';

import { ButtonSettingProps } from './types.js';

import { ButtonSettingPrimitive } from './style.js';

export function ButtonSetting(props: ButtonSettingProps) {
  const { children, onClick } = props;

  return <ButtonSettingPrimitive onClick={onClick}>{children}</ButtonSettingPrimitive>;
}
