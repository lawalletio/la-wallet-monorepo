import React from 'react';

import { CaretRightIcon, SafariLogo } from '../Icons';

import { Flex } from '../Flex';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { CardAlertPrimitive } from './style';
import { CardAlertProps } from './types';

export function CardAlert(props: CardAlertProps) {
  const { title, description, isHome = true } = props;

  return (
    <CardAlertPrimitive>
      <Flex direction="column" gap={4}>
        <Heading as="h6">{title}</Heading>
        <Text>{description}</Text>
      </Flex>
      <div>{isHome ? <SafariLogo /> : <CaretRightIcon />}</div>
    </CardAlertPrimitive>
  );
}
