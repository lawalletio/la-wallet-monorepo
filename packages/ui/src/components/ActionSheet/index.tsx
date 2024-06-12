import React from 'react';
import { useState, useEffect } from 'react';
import { ActionSheetProps } from './types';

import { ActionSheetPrimitive, ActionSheetContent, ActionSheetWrapper, ActionSheetHeader } from './style';
import { Text } from '../Text';
import { Flex } from '../Flex';
import { Button } from '../Button';

export function ActionSheet(props: ActionSheetProps) {
  const { children, isOpen, onClose, title, description, cancelText } = props;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <ActionSheetPrimitive $isOpen={open}>
      <ActionSheetWrapper>
        <ActionSheetContent>
          <ActionSheetHeader>
            {title && (
              <Text isBold align="center">
                {title}
              </Text>
            )}
            {description && (
              <Text align="center" size="small">
                {description}
              </Text>
            )}
          </ActionSheetHeader>
          {children}
        </ActionSheetContent>
        <Flex>
          <Button variant="bezeledGray" onClick={handleClose}>
            {cancelText}
          </Button>
        </Flex>
      </ActionSheetWrapper>
    </ActionSheetPrimitive>
  );
}
