import { GoogleOAuthProvider } from '@react-oauth/google';
import { FunctionComponent, ReactNode, useContext } from 'react';
import styled from 'styled-components';
import { Footer, Header, Modal } from './components/base';

import 'bootstrap/dist/css/bootstrap.min.css';
import { ToggleThemeContext } from './Root';
import { GlobalStyle } from './config/theme';
import { ModalContextProvider } from './contexts/ModalContext';
import { VcContextProvider } from './contexts/VcContext';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
`;

export type AppProps = {
  children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
  const toggleTheme = useContext(ToggleThemeContext);

  return (
    <>
      <GlobalStyle />
      <Wrapper>
        <Header handleToggleClick={toggleTheme} />
        <ModalContextProvider>
          <VcContextProvider>
            <GoogleOAuthProvider
              clientId={`${process.env.GATSBY_GOOGLE_DRIVE_CLIENT_ID}`}
            >
              {children}
            </GoogleOAuthProvider>
          </VcContextProvider>
          <Modal />
        </ModalContextProvider>
        <Footer />
      </Wrapper>
    </>
  );
};
