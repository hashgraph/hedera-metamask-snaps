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

import { useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { Card, InstallFlaskButton } from '../components/base';
import {
  ConfigureGoogleAccount,
  ConnectIdentitySnap,
  CreateVC,
  DeleteAllVCs,
  GetAccountInfo,
  GetAllVCs,
  GetSpecificVC,
  GetVP,
  ReconnectIdentitySnap,
  RemoveVC,
  ResolveDID,
  SendHelloHessage,
  SyncGoogleVCs,
  Todo,
  ToggleMetamaskPopups,
  VerifyVC,
  VerifyVP,
} from '../components/cards';
import {
  CardContainer,
  ErrorMessage,
  Heading,
  PageContainer,
  Span,
} from '../config/styles';
import { MetaMaskContext, MetamaskActions } from '../contexts/MetamaskContext';
import { PublicAccountInfo } from '../types/snap';
import { connectSnap, getCurrentNetwork, getSnap } from '../utils';
import { getNetwork, validHederaChainID } from '../utils/hedera';
import { SwitchDIDMethod } from '../components/cards/SwitchDIDMethod';

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [metamaskAddress, setMetamaskAddress] = useState('');
  const [currentChainId, setCurrentChainId] = useState('');
  const [isHederaNetwork, setIsHederaNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [accountInfo, setAccountInfo] = useState<PublicAccountInfo>(
    {} as PublicAccountInfo,
  );

  useEffect(() => {
    if (validHederaChainID(currentChainId)) {
      setIsHederaNetwork(true);
    } else {
      setIsHederaNetwork(false);
    }
    setMetamaskAddress(metamaskAddress);
    setCurrentNetwork(getNetwork(currentChainId));
  }, [metamaskAddress, currentChainId]);

  const handleConnectClick = async () => {
    try {
      setMetamaskAddress((await connectSnap()) as string);
      setCurrentChainId(await getCurrentNetwork());
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      setAccountInfo({} as PublicAccountInfo);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <PageContainer>
      <Heading>
        Welcome to <Span>Identify Snap</Span>
      </Heading>
      <Container>
        <Row>
          <Col>
            <dt>Status:</dt>
            <dd>{currentNetwork ? 'Connected' : 'Disconnected'}</dd>
            <dt>Current Network:</dt>
            <dd>{currentNetwork}</dd>
            <dt>Currently Connected Metamask Account: </dt>
            <dd>{metamaskAddress}</dd>
          </Col>
          <Col sm="12" md="8">
            <dt>Account Info</dt>
            {isHederaNetwork
              ? accountInfo && (
                  <>
                    <dd>Hedera Account ID: {accountInfo?.accountID}</dd>
                    <dd>Did Method: {accountInfo?.method}</dd>
                    <dd>Did: {accountInfo?.did}</dd>
                    <dd>Metamask Address: {accountInfo?.metamaskAddress}</dd>
                    <dd>Snap Address: {accountInfo?.snapAddress}</dd>
                  </>
                )
              : accountInfo && (
                  <>
                    <dd>Did Method: {accountInfo?.method}</dd>
                    <dd>Did: {accountInfo?.did}</dd>
                    <dd>EVM Address: {accountInfo?.metamaskAddress}</dd>
                  </>
                )}
          </Col>
        </Row>
      </Container>
      {state.error && (
        <ErrorMessage>
          <b>An error happened:</b> {state.error.message}
        </ErrorMessage>
      )}
      <CardContainer>
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install Metamask Flask',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        <ConnectIdentitySnap handleConnectClick={handleConnectClick} />
        <ReconnectIdentitySnap handleConnectClick={handleConnectClick} />

        <SendHelloHessage
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />

        <ToggleMetamaskPopups
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />

        <SwitchDIDMethod
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <GetAccountInfo
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
          setAccountInfo={setAccountInfo}
        />
        <ResolveDID
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <GetSpecificVC
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <GetAllVCs
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <CreateVC
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <VerifyVC
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <RemoveVC
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <DeleteAllVCs
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <GetVP
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <VerifyVP
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <ConfigureGoogleAccount
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <SyncGoogleVCs
          setMetamaskAddress={setMetamaskAddress}
          setCurrentChainId={setCurrentChainId}
        />
        <Todo />
      </CardContainer>
    </PageContainer>
  );
};

export default Index;
