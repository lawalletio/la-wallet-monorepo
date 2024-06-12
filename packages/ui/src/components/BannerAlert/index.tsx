import React from 'react';

import { ArrowRightIcon } from '../Icons/index.js';
import Security from './Background/Security.js';
import Voucher from './Background/Voucher.js';

import { BannerAlertProps } from './types.js';
import { BannerAlertPrimitive, Asset } from './style.js';
import { useTheme } from 'styled-components';
import { Flex } from '../Flex/index.js';
import { Heading } from '../Heading/index.js';
import { Text } from '../Text/index.js';
import { Icon } from '../Icon/index.js';

export function BannerAlert(props: BannerAlertProps) {
  const { title, description, color = 'success' } = props;
  const theme = useTheme();

  return (
    <BannerAlertPrimitive $color={theme.colors[color]}>
      <div>
        <Flex direction="column" gap={4}>
          <Heading as="h6">{title}</Heading>
          <Text>{description}</Text>
        </Flex>
        <Icon color={theme.colors[color]}>
          <ArrowRightIcon />
        </Icon>
      </div>
      <Asset>
        {/* {color === 'success' && ()} */}
        {color === 'warning' && <Voucher />}
        {color === 'error' && <Security />}
      </Asset>
    </BannerAlertPrimitive>
  );
}
