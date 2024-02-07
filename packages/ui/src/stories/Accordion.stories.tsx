import type { Meta, StoryObj } from '@storybook/react';

import { Accordion, AccordionBody, Text, Flex } from '../components';
import React, { ReactNode } from 'react';

const meta = {
  title: 'Atoms/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    trigger: {
      type: 'string',
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultComponent: Story = {
  args: {
    trigger: 'Enviado',
    variant: 'filled',
  },
  render: function Render(args) {
    return (
      <Accordion {...args}>
        <AccordionBody>
          <Flex align="center" justify="space-between">
            <Text size="small">Fecha</Text>
            <Flex direction="column" align="end">
              <Text>12:01</Text>
              <Text>enero 6, 2024</Text>
            </Flex>
          </Flex>
        </AccordionBody>
      </Accordion>
    );
  },
};

export const borderlessVariant: Story = {
  args: {
    trigger: 'Enviado',
    variant: 'borderless',
  },
  render: function Render(args) {
    return (
      <Accordion {...args}>
        <AccordionBody>
          <Flex align="center" justify="space-between">
            <Text size="small">Fecha</Text>
            <Flex direction="column" align="end">
              <Text>12:01</Text>
              <Text>enero 6, 2024</Text>
            </Flex>
          </Flex>
        </AccordionBody>
      </Accordion>
    );
  },
};
