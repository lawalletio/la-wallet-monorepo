import React from 'react';
import { ItemProps } from './types.js';
import { Flex } from '../../Flex/index.js';
import { Avatar } from '../../Avatar/index.js';
import { Text } from '../../Text/index.js';

export function Item({ lud16 }: ItemProps) {
  const [username, domain] = lud16.split('@');

  return (
    <Flex align="center" gap={8}>
      <Avatar>
        <Text size="small">{username.substring(0, 2).toUpperCase()}</Text>
      </Avatar>
      <Flex align="center">
        <Text>{username}</Text>
        <Text>@{domain}</Text>
      </Flex>
    </Flex>
  );
}
