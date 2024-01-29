import type { Meta, StoryObj } from '@storybook/react';

import { Dashboard } from './Page/Dashboard';

const meta = {
  title: 'Page/Examples',
  component: Dashboard,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardPage: Story = {};
