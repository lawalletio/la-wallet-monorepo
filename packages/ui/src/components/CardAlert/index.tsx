import React from 'react';

import { Heading, Text, Flex } from '../';
import { CaretRightIcon, SafariLogo } from '../Icons';

import { CardAlertProps } from './types';
import { CardAlertPrimitive } from './style';

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
