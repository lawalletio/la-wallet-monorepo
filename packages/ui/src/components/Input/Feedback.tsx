import React from 'react';

import { Text } from '../Text/index.js';

import { FeedbackProps } from './types.js';

import { FeedbackPrimitive } from './style.js';

export function Feedback(props: FeedbackProps) {
  const { children, status, show = false } = props;

  return (
    <FeedbackPrimitive $isShow={show} $isSuccess={status === 'success'}>
      <Text align="right" size="small">
        {children}
      </Text>
    </FeedbackPrimitive>
  );
}
