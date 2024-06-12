import React from 'react';
import { LoaderContainer, Loader as LoaderStyle, ButtonLoader } from './LoaderStyle';

export const Loader = () => {
  return (
    <LoaderContainer>
      <LoaderStyle />
    </LoaderContainer>
  );
};

export const BtnLoader = () => <ButtonLoader />;
