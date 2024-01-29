'use client';

import { theme } from '@lawallet/ui';
import { styled } from 'styled-components';

interface HeroCardProps {}

export const HeroCard = styled.div<HeroCardProps>`
  display: flex;
  flex-direction: column;
  height: 200px;

  background-color: ${theme.colors.gray15};
  border-radius: 0 0 20px 20px;
`;
