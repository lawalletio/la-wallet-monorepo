import React from 'react';

import { CaretRightIcon, SafariLogo } from '../Icons/index.js';

import { Flex } from '../Flex/index.js';
import { Heading } from '../Heading/index.js';
import { Text } from '../Text/index.js';
import { CardAlertPrimitive } from './style.js';
import { CardAlertProps } from './types.js';

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
