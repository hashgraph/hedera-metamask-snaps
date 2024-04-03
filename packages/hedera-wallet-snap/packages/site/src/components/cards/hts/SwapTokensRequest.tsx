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

import type { FC } from 'react';
import { useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../../contexts/MetamaskContext';
import useModal from '../../../hooks/useModal';
import type {
  Account,
  AtomicSwap,
  CreateSwapRequestParams,
  SimpleTransfer,
} from '../../../types/snap';
import {
  createSwapRequest,
  shouldDisplayReconnectButton,
} from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import type { GetExternalAccountRef } from '../../sections/ExternalAccount';
import ExternalAccount from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SwapTokensRequest: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendHbarAmount, setSendHbarAmount] = useState(0);
  const [receiveTokenId, setReceiveTokenId] = useState('');
  const [receiveTokenAmount, setReceiveTokenAmount] = useState(0);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateSwapRequestClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      if (externalAccountParams === undefined) {
        throw new Error('undefined external account params');
      }

      const toTransfer: SimpleTransfer = {
        assetType: 'HBAR',
        to: sendToAddress,
        amount: sendHbarAmount,
      } as SimpleTransfer;

      const fromTransfer: SimpleTransfer = {
        assetType: 'TOKEN',
        to: '', //todo - get sender address
        amount: receiveTokenAmount,
        assetId: receiveTokenId,
      } as SimpleTransfer;

      const atomicSwap = {
        sender: toTransfer,
        receiver: fromTransfer,
      } as AtomicSwap;

      const atomicSwaps = [atomicSwap];

      const createSwapRequestParams = {
        atomicSwaps,
      } as CreateSwapRequestParams;

      const response: any = await createSwapRequest(
        network,
        mirrorNodeUrl,
        createSwapRequestParams,
        externalAccountParams,
      );

      const { receipt, currentAccount } = response;
      setAccountInfo(currentAccount);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`receipt: ${receipt}`);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`current account: ${currentAccount}`);

      console.log(`response: ${JSON.stringify(response)}`);

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
        description:
          'Creates an atomic swap request using the Hedera Token Service.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <br />
            <label>
              Enter the address for the other party
              <input
                type="string"
                style={{ width: '100%' }}
                value={sendToAddress}
                placeholder=""
                onChange={(e) => setSendToAddress(e.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the amount of Hbar for the sender to send
              <input
                type="number"
                style={{ width: '100%' }}
                value={sendHbarAmount}
                placeholder=""
                onChange={(e) =>
                  setSendHbarAmount(parseInt(e.target.value, 10))
                }
              />
            </label>
            <br />
            <label>
              Enter the token id for the receiver to send
              <input
                type="string"
                style={{ width: '100%' }}
                value={receiveTokenId}
                placeholder=""
                onChange={(e) => setReceiveTokenId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the token amount for the receiver to send
              <input
                type="number"
                style={{ width: '100%' }}
                value={receiveTokenAmount}
                placeholder=""
                onChange={(e) =>
                  setReceiveTokenAmount(parseInt(e.target.value, 10))
                }
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
