import React from 'react';

import { Icon } from '../Icon';
import { AlertIcon, CheckIcon } from '../Icons';
import { Text } from '../Text';

import { AlertProps } from './types';

import { useTheme } from 'styled-components';
import { AlertPrimitive } from './style';

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
