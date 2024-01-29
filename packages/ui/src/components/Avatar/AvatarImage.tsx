import React from 'react';

import { AvatarImagePrimitive } from './style';

interface ComponentProps {
  src: string;
  alt: string;
}

export function AvatarImage(props: ComponentProps) {
  const { src, alt } = props;

  return <AvatarImagePrimitive src={src} alt={alt} />;
}
