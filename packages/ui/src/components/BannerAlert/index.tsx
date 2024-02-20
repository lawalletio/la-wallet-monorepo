import React from 'react';

import { Flex, Heading, Text, Icon } from '../';
import { ArrowRightIcon } from '../Icons';
import Security from './Background/Security';
import Voucher from './Background/Voucher';

import { theme } from '../../theme';

import { BannerAlertProps } from './types';
import { BannerAlertPrimitive, Asset } from './style';

export function BannerAlert(props: BannerAlertProps) {
  const { title, description, color = 'success' } = props;

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
