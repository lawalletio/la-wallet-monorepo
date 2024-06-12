import React from 'react';

import { HeroCardProps } from './types.js';

import { HeroCardPrimitive } from './style.js';

export function HeroCard(props: HeroCardProps) {
  const { children } = props;

  return <HeroCardPrimitive>{children}</HeroCardPrimitive>;
}
