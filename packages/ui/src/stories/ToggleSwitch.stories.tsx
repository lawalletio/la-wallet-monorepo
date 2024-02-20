import type { Meta, StoryObj } from '@storybook/react';

import { ToggleSwitch } from '../components';

const meta = {
  title: 'Atoms/ToggleSwitch',
  component: ToggleSwitch,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    id: 'test',
    onChange: () => null,
  },
};
