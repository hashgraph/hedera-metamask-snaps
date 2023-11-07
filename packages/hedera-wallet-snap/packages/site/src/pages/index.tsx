/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { useContext, useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import Select from 'react-select';
import { Card, InstallFlaskButton } from '../components/base';
import { ConnectPulseSnap } from '../components/cards/ConnectPulseSnap';
import { GetAccountInfo } from '../components/cards/GetAccountInfo';
import { ReconnectPulseSnap } from '../components/cards/ReconnectPulseSnap';
import { SendHelloHessage } from '../components/cards/SendHelloMessage';
import { Todo } from '../components/cards/Todo';
import Tokens from '../components/cards/Tokens';
import { TransferCrypto } from '../components/cards/TransferCrypto';
import { networkOptions } from '../config/constants';
import {
  CardContainer,
  ErrorMessage,
  Heading,
  Notice,
  PageContainer,
  Span,
  Subtitle,
} from '../config/styles';
import { MetaMaskContext, MetamaskActions } from '../contexts/MetamaskContext';
import { Account } from '../types/snap';
import { connectSnap, getSnap } from '../utils';

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [currentNetwork, setCurrentNetwork] = useState(networkOptions[0]);
  const [mirrorNodeUrl, setMirrorNodeUrl] = useState('');
  const [accountInfo, setAccountInfo] = useState<Account>({} as Account);

  const handleNetworkChange = (network: any) => {
    setCurrentNetwork(network);
  };

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();
      console.log('Installed Snap: ', installedSnap);

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      setAccountInfo({} as Account);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <PageContainer>
      <Heading>
        Welcome to <Span>Hedera Pulse Snap Demo</Span>
      </Heading>
      <Subtitle>
        <label>Select network</label>
        <Select
          closeMenuOnSelect
          isSearchable={false}
          isClearable={false}
          options={networkOptions}
          value={currentNetwork}
          onChange={handleNetworkChange}
          styles={{
            control: (base: any) => ({
              ...base,
              border: `1px solid grey`,
              marginBottom: 8,
            }),
          }}
        />
        <Form.Label>Enter your own Mirror Node URL to use(Optional)</Form.Label>
        <Form.Control
          size="lg"
          type="text"
          placeholder="eg. https://testnet.mirrornode.hedera.com"
          style={{ marginBottom: 8 }}
          onChange={(e) => setMirrorNodeUrl(e.target.value)}
        />
      </Subtitle>
      <Container>
        <Row>
          <Col>
            <dt>Hedera Account ID: </dt>
            <dd>{accountInfo?.hederaAccountId}</dd>
            <dt>Hedera EVM Address: </dt>
            <dd>{accountInfo?.hederaEvmAddress}</dd>

            <dt>Balance: </dt>
            <dd>
              {accountInfo?.balance?.hbars
                ? `${accountInfo?.balance?.hbars.toString()} Hbar`
                : ''}
            </dd>
          </Col>
          {accountInfo?.balance?.tokens && (
            <Col>
              <Tokens tokens={accountInfo?.balance?.tokens} />
            </Col>
          )}
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
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        <ConnectPulseSnap handleConnectClick={handleConnectClick} />
        <ReconnectPulseSnap handleConnectClick={handleConnectClick} />

        <SendHelloHessage
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <GetAccountInfo
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <TransferCrypto
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <Todo />
      </CardContainer>
      <Notice>
        <p>
          Please note that this demo site only serves as an example of how an
          app would interact with <b>Hedera Pulse Snap</b> and you should do
          your own diligence before integrating it into production grade apps.
          Learn more about{' '}
          <a href="https://docs.metamask.io/snaps/" target="_blank">
            Metamask Snaps
          </a>
          .
        </p>
      </Notice>
    </PageContainer>
  );
};

export default Index;
