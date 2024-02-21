import { styled } from 'styled-components';

import { baseTheme } from '../../../theme';

export const HeroCardPrimitive = styled.div`
  display: flex;
  flex-direction: column;
  height: 200px;

  background-color: ${(props) => props.theme.colors.gray15};
  border-radius: 0 0 20px 20px;
`;
