import React from 'react';

import { Icon } from '../Icon/index.js';
import { AlertIcon, CheckIcon } from '../Icons/index.js';
import { Text } from '../Text/index.js';

import { AlertProps } from './types.js';

import { useTheme } from 'styled-components';
import { AlertPrimitive } from './style.js';

export function Alert(props: AlertProps) {
  const { title, description, type = 'success', isOpen } = props;

  const isSuccess = type === 'success';
  const theme = useTheme();

  return (
    <AlertPrimitive $background={theme.colors[`${type}15`]} $color={type && theme.colors[type]} $isOpen={!!isOpen}>
      <div className="box">
        <Icon size="small">{isSuccess ? <CheckIcon /> : <AlertIcon />}</Icon>
        <div>
          {title && (
            <Text isBold size="small">
              {title}
            </Text>
          )}
          {description && <Text size="small">{description}</Text>}
        </div>
        <div className="progress" />
      </div>
    </AlertPrimitive>
  );
}
