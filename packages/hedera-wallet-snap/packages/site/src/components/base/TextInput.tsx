import styled from 'styled-components';

export const TextInput = styled.textarea<{
  fullWidth?: boolean;
}>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;
