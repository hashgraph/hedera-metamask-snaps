/*-
 *
 * Hedera Identify Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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

  console.log(
    'process.env.GATSBY_GOOGLE_DRIVE_CLIENT_ID',
    process.env.GATSBY_GOOGLE_DRIVE_CLIENT_ID,
  );

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
