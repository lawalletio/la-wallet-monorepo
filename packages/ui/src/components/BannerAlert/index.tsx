import React from 'react';

import { ArrowRightIcon } from '../Icons';
import Security from './Background/Security';
import Voucher from './Background/Voucher';

import { BannerAlertProps } from './types';
import { BannerAlertPrimitive, Asset } from './style';
import { useTheme } from 'styled-components';
import { Flex } from '../Flex';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Icon } from '../Icon';

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
