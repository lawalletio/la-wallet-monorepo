import { styled } from 'styled-components';

export const CardStyle = styled.div`
  display: flex;
  padding: 12px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: stretch;

  border-radius: 12px;
  background: ${(props) => props.theme.colors.gray15};
`;
