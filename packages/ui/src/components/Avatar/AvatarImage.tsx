import React from 'react';

import { AvatarImagePrimitive } from './style.js';

interface ComponentProps {
  src: string;
  alt: string;
}

export function AvatarImage(props: ComponentProps) {
  const { src, alt } = props;

  return <AvatarImagePrimitive alt={alt} src={src} />;
}
