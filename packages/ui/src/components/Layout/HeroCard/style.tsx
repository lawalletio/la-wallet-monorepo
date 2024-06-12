import { styled } from 'styled-components';

export const HeroCardPrimitive = styled.div`
  display: flex;
  flex-direction: column;

  background-color: ${(props) => props.theme.colors.gray15};
  border-radius: 0 0 20px 20px;
`;
