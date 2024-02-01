import type { Meta, StoryObj } from '@storybook/react';

import { BannerAlert } from '../components';

const meta = {
  title: 'Atoms/BannerAlert',
  component: BannerAlert,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof BannerAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    title: 'Lorem ipsum dolor.',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
  },
};

export const warningColor: Story = {
  args: {
    title: 'Lorem ipsum dolor.',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
    color: 'warning',
  },
};

export const errorColor: Story = {
  args: {
    title: 'Lorem ipsum dolor.',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
    color: 'error',
  },
};
