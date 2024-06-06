import { styled } from 'styled-components';

interface SubnavbarProps {}

export const SubnavbarPrimitive = styled.div<SubnavbarProps>`
  position: fixed;
  bottom: 0;
  z-index: 2;

  width: 100%;
  height: 60px;

  background-color: ${(props) => props.theme.colors.gray15};
  border-radius: 20px 20px 0 0;
`;
