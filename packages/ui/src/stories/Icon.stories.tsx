import type { Meta, StoryObj } from '@storybook/react';

import { Icon, CheckIcon } from '../components';
import React from 'react';

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    children: <CheckIcon />,
    size: 'normal',
  },
};

export const smallSize: Story = {
  args: {
    children: <CheckIcon />,
    size: 'small',
  },
};

export const withColor: Story = {
  args: {
    children: <CheckIcon />,
    color: 'red',
  },
};
