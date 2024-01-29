import React, { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Alert, Button } from '../components';

const meta = {
  title: 'Atoms/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    description: {
      type: 'string',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    type: 'success',
    description: 'Texto copiado al porta papeles.',
  },
  render: function Render(args) {
    const [show, setShow] = useState(false);

    return (
      <>
        <Button onClick={() => setShow(!show)}>Click me</Button>
        <Alert isOpen={show} {...args} />
      </>
    );
  },
};

export const errorType: Story = {
  args: {
    isOpen: true,
    type: 'error',
    description: 'Algo ocurrio en el sistema.',
  },
};

export const warningType: Story = {
  args: {
    isOpen: true,
    type: 'warning',
    description: 'Ups...',
  },
};

export const withTitle: Story = {
  args: {
    isOpen: true,
    type: 'success',
    title: 'Perfecto!',
    description: 'Texto copiado al porta papeles.',
  },
};
