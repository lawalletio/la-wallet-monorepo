import React, { ReactNode } from 'react';
import { AvatarPrimitive } from './style';

interface ComponentProps {
  children: ReactNode;
  size?: 'normal' | 'large';
}

export function Avatar(props: ComponentProps) {
  const { children, size = 'normal' } = props;

  const isNormal = size === 'normal';

  return <AvatarPrimitive $isNormal={isNormal}>{children}</AvatarPrimitive>;
}

Avatar.displayName = 'Avatar';
