import type { Meta, StoryObj } from '@storybook/react';

import { LinkSetting } from '../components';

const meta = {
  title: 'Atoms/LinkSetting',
  component: LinkSetting,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof LinkSetting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    children: 'Link setting',
    href: '',
  },
};
