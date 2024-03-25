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

import _ from 'lodash';
import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../../contexts/MetamaskContext';
import useModal from '../../../hooks/useModal';
import { Account, AtomicSwapRequestParams } from '../../../types/snap';
import { createSwapRequest, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SwapTokensRequest: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [sendTokenId, setSendTokenId] = useState('');
  const [sendTokenAmount, setSendTokenAmount] = useState(1);
  const [sendHbarAmount, setSendHbarAmount] = useState(1);
  const [receiveTokenId, setReceiveTokenId] = useState('');
  const [receiveTokenAmount, setReceiveTokenAmount] = useState(1);
  const [receiveHbarAmount, setReceiveHbarAmount] = useState(1);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateSwapRequestClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const swapTokenParams = {
        destinationAccountId,
        sendTokenId,
        sendTokenAmount,
        receiveTokenId,
        receiveTokenAmount,
        sendHbarAmount,
        receiveHbarAmount,
      } as AtomicSwapRequestParams;

      const response: any = await createSwapRequest(
        network,
        mirrorNodeUrl,
        swapTokenParams,
        externalAccountParams,
      );

      const { receipt, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('receipt: ', receipt);

      showModal({
        title: 'Transaction Receipt',
        content: JSON.stringify({ receipt }, null, 4),
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'createSwapRequest',
        description: 'Creates an atomic swap request using the Hedera Token Service.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <br />
            <label>
              Enter the destination Account ID
              <input
                type="text"
                style={{ width: '100%' }}
                value={destinationAccountId}
                placeholder="0.0.1234"
                onChange={(e) => setDestinationAccountId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the amount of Hbar to send
              <input
                type="number"
                style={{ width: '100%' }}
                value={sendHbarAmount}
                placeholder="1"
                onChange={(e) => setSendHbarAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
            <label>
              Enter the amount of Hbar to receive
              <input
                type="number"
                style={{ width: '100%' }}
                value={receiveHbarAmount}
                placeholder="1"
                onChange={(e) => setReceiveHbarAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
            <label>
              Enter the token ID to send
              <input
                type="text"
                style={{ width: '100%' }}
                value={sendTokenId}
                placeholder="0.0"
                onChange={(e) => setSendTokenId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the token ID to receive
              <input
                type="text"
                style={{ width: '100%' }}
                value={receiveTokenId}
                placeholder="0.0"
                onChange={(e) => setReceiveTokenId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the token amount to send
              <input
                type="number"
                style={{ width: '100%' }}
                value={sendTokenAmount}
                placeholder="1"
                onChange={(e) => setSendTokenAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
            <label>
              Enter the token amount to receive
              <input
                type="number"
                style={{ width: '100%' }}
                value={receiveTokenAmount}
                placeholder="1"
                onChange={(e) => setReceiveTokenAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Create Swap Request"
            onClick={handleCreateSwapRequestClick}
            disabled={!state.installedSnap}
            loading={loading}
          />
        ),
      }}
      disabled={!state.installedSnap}
      fullWidth={
        state.isFlask &&
        Boolean(state.installedSnap) &&
        !shouldDisplayReconnectButton(state.installedSnap)
      }
    />
  );
};

export { SwapTokensRequest };
