import React from 'react';

import { HeroCardProps } from './types';

import { HeroCardPrimitive } from './style';

export function HeroCard(props: HeroCardProps) {
  const { children } = props;

  return <HeroCardPrimitive>{children}</HeroCardPrimitive>;
}
