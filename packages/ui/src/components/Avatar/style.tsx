import { styled } from 'styled-components';

interface AvatarPrimitiveProps {
  $isNormal: boolean;
}

export const AvatarPrimitive = styled.div<AvatarPrimitiveProps>`
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
  min-width: ${(props) => (props.$isNormal ? '35px' : '45px')};
  min-height: ${(props) => (props.$isNormal ? '35px' : '45px')};
  max-width: ${(props) => (props.$isNormal ? '35px' : '45px')};
  max-height: ${(props) => (props.$isNormal ? '35px' : '45px')};

  background-color: ${(props) => props.theme.colors.gray20};
  border: 1px solid ${(props) => props.theme.colors.gray30};
  border-radius: 50%;

  font-size: 14px;
`;

export const AvatarImagePrimitive = styled.img`
  width: 100%;
  height: auto;
`;
