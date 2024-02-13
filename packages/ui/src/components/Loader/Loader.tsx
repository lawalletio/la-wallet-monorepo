import React from 'react';
import { LoaderContainer, Loader as LoaderStyle, ButtonLoader } from './LoaderStyle';

export const Loader = () => {
  return (
    <LoaderContainer>
      <LoaderStyle />
    </LoaderContainer>
  );
};

export const MainLoader = () => <LoaderStyle />;

export const BtnLoader = () => <ButtonLoader />;
