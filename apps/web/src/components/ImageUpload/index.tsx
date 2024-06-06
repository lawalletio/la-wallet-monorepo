import React, { useState, useRef } from 'react';
import { useTheme } from 'styled-components';
import { Avatar, Flex, Button, Text } from '@lawallet/ui';

export const ImageUpload = (props) => {
  const {} = props;

  const theme = useTheme();

  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState<string | any>('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Flex gap={16}>
      <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} />
      <Avatar size={20} alt="Jona" src={preview || '/profile.png'} />
      <Flex direction="column">
        <Button size="small" variant="borderless" onClick={handleButtonClick}>
          Subir nueva foto
        </Button>
        <Text size="small" color={theme.colors.gray50}>
          Se recomienda al menos 800x800.
        </Text>
        <Text size="small" color={theme.colors.gray50}>
          Se permite JPG o PNG.
        </Text>
      </Flex>
    </Flex>
  );
};
