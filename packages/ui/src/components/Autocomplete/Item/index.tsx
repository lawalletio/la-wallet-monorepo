import React from 'react';

import { Avatar, Flex, Text } from '../../index';

import { ItemProps } from './types';

export function Item({ lud16 }: ItemProps) {
  const [username, domain] = lud16.split('@');

  return (
    <Flex align="center" gap={8}>
      <Avatar alt={username.substring(0, 2).toUpperCase()} />
      <Flex align="center">
        <Text>{username}</Text>
        <Text>@{domain}</Text>
      </Flex>
    </Flex>
  );
}
