import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  margin: 1rem auto;
  text-align: center;
`;

const BaseLoader = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-block;
  border-top: 2px solid #fff;
  border-right: 2px solid transparent;
  box-sizing: border-box;
  animation: ${rotate} 1s linear infinite;
`;

const Loader = styled(BaseLoader)``;

const ButtonLoader = styled(BaseLoader)`
  width: 28px;
  height: 28px;
`;

const ModalLoader = styled(BaseLoader)`
  width: 48px;
  height: 48px;
  border-top: 4px solid #c31d98;
  border-right: 4px solid transparent;
  animation: ${rotate} 1s linear infinite;
  margin: 4rem auto;
  position: relative;

  &::after {
    content: '';
    box-sizing: border-box;
    position: absolute;
    left: 0;
    top: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border-bottom: 4px solid #4fb8f1;
    border-left: 4px solid transparent;
  }
`;

const LoadError = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 0px;
  margin: 1rem auto;

  @media screen and (min-width: 768px) {
    padding: 16px;
    gap: 8px;
    margin: 0 auto;
  }
`;

export { LoaderContainer, Loader, ButtonLoader, ModalLoader, LoadError };
