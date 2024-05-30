/*-
 *
 * Hedera Wallet Snap
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

import { useContext, useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import Select from 'react-select';
import { Card, InstallFlaskButton } from '../components/base';
import { ApproveAllowance } from '../components/cards/ApproveAllowance';
import { ConnectHederaWalletSnap } from '../components/cards/ConnectHederaWalletSnap';
import { DeleteAccount } from '../components/cards/DeleteAccount';
import { DeleteAllowance } from '../components/cards/DeleteAllowance';
import { GetAccountInfo } from '../components/cards/GetAccountInfo';
import { GetTransactions } from '../components/cards/GetTransactions';
import { ReconnectHederaWalletSnap } from '../components/cards/ReconnectHederaWalletSnap';
import { SendHelloHessage } from '../components/cards/SendHelloMessage';
import { ShowAccountPrivateKey } from '../components/cards/ShowAccountPrivateKey';
import { SignMessage } from '../components/cards/SignMessage';
import { StakeHbar } from '../components/cards/StakeHbar';
import { Todo } from '../components/cards/Todo';
import Tokens from '../components/cards/Tokens';
import { TransferCrypto } from '../components/cards/TransferCrypto';
import { UnstakeHbar } from '../components/cards/UnstakeHbar';
import { CallSmartContractFunction } from '../components/cards/hscs/CallSmartContractFunction';
import { CreateSmartContract } from '../components/cards/hscs/CreateSmartContract';
import { DeleteSmartContract } from '../components/cards/hscs/DeleteSmartContract';
import { EthereumTransaction } from '../components/cards/hscs/EthereumTransaction';
import { GetSmartContractBytecode } from '../components/cards/hscs/GetSmartContractBytecode';
import { GetSmartContractFunction } from '../components/cards/hscs/GetSmartContractFunction';
import { GetSmartContractInfo } from '../components/cards/hscs/GetSmartContractInfo';
import { UpdateSmartContract } from '../components/cards/hscs/UpdateSmartContract';
import { AssociateTokens } from '../components/cards/hts/AssociateTokens';
import { AtomicSwapComplete } from '../components/cards/hts/AtomicSwapComplete';
import { AtomicSwapInitiate } from '../components/cards/hts/AtomicSwapInitiate';
import { BurnToken } from '../components/cards/hts/BurnToken';
import { CreateToken } from '../components/cards/hts/CreateToken';
import { DeleteToken } from '../components/cards/hts/DeleteToken';
import { DisableKYCAccount } from '../components/cards/hts/DisableKYCAccount';
import { DissociateTokens } from '../components/cards/hts/DissociateTokens';
import { EnableKYCAccount } from '../components/cards/hts/EnableKYCAccount';
import { FreezeAccount } from '../components/cards/hts/FreezeAccount';
import { MintToken } from '../components/cards/hts/MintToken';
import { PauseToken } from '../components/cards/hts/PauseToken';
import { UnfreezeAccount } from '../components/cards/hts/UnfreezeAccount';
import { UnpauseToken } from '../components/cards/hts/UnpauseToken';
import { UpdateToken } from '../components/cards/hts/UpdateToken';
import { UpdateTokenFeeSchedule } from '../components/cards/hts/UpdateTokenFeeSchedule';
import { WipeToken } from '../components/cards/hts/WipeToken';
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
import type { Account } from '../types/snap';
import { connectSnap, getSnap } from '../utils';

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [currentNetwork, setCurrentNetwork] = useState(networkOptions[0]);
  const [mirrorNodeUrl, setMirrorNodeUrl] = useState('');
  const [accountInfo, setAccountInfo] = useState<Account>({} as Account);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

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
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  return (
    <PageContainer>
      <Heading>
        Welcome to <Span>Hedera Wallet Snap Demo</Span>
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
          onChange={(error) => setMirrorNodeUrl(error.target.value)}
        />
      </Subtitle>
      <Container>
        <Row>
          <Col>
            <dt>Hedera Account ID: </dt>
            <dd>{accountInfo?.hederaAccountId}</dd>
            <dt>Hedera EVM Address: </dt>
            <dd>{accountInfo?.hederaEvmAddress}</dd>
            <dt>Hedera Public Key: </dt>
            <dd>{accountInfo?.publicKey}</dd>

            <dt>Balance: </dt>
            <dd>
              {accountInfo?.balance?.hbars
                ? `${accountInfo?.balance?.hbars.toString()} Hbar`
                : ''}
            </dd>
          </Col>
          {accountInfo?.balance?.tokens && (
            <Col>
              <Form.Check
                type="checkbox"
                label="Show tokens with 0 balances"
                checked={showZeroBalances}
                onChange={() => setShowZeroBalances(!showZeroBalances)}
              />
              <Tokens
                tokens={accountInfo?.balance?.tokens}
                showZeroBalances={showZeroBalances}
              />
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
        <ConnectHederaWalletSnap handleConnectClick={handleConnectClick} />
        <ReconnectHederaWalletSnap handleConnectClick={handleConnectClick} />

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

        <ShowAccountPrivateKey
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <SignMessage
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <GetTransactions
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <TransferCrypto
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <CreateToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UpdateToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UpdateTokenFeeSchedule
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DeleteToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <MintToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <BurnToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <PauseToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UnpauseToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <AssociateTokens
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DissociateTokens
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <FreezeAccount
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UnfreezeAccount
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <EnableKYCAccount
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DisableKYCAccount
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <WipeToken
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <StakeHbar
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UnstakeHbar
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <ApproveAllowance
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DeleteAllowance
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DeleteAccount
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <AtomicSwapInitiate
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <AtomicSwapComplete
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <CreateSmartContract
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <UpdateSmartContract
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <DeleteSmartContract
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <CallSmartContractFunction
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <GetSmartContractFunction
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <GetSmartContractBytecode
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <GetSmartContractInfo
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <EthereumTransaction
          network={currentNetwork.value}
          mirrorNodeUrl={mirrorNodeUrl}
          setAccountInfo={setAccountInfo}
        />

        <Todo />
      </CardContainer>
      <Notice>
        <p>
          Please note that this demo site only serves as an example of how an
          app would interact with <b>Hedera Wallet Snap</b> and you should do
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
