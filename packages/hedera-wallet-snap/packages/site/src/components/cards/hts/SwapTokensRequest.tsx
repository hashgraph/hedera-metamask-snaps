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
  MetamaskActions,
  MetaMaskContext,
} from '../../../contexts/MetamaskContext';
import useModal from '../../../hooks/useModal';
import type {
  Account,
  AtomicSwap,
  AtomicSwapRequestParams,
  TransferData,
} from '../../../types/snap';
import { AssetType } from '../../../types/snap';
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
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [sendHbarAmount, setSendHbarAmount] = useState<number>();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateSwapRequestClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      if (externalAccountParams === undefined) {
        throw new Error('undefined external account params');
      }

      const senderData = {
        accountId: externalAccountParams.externalAccount.accountIdOrEvmAddress,
        amount: sendHbarAmount,
        assetType: AssetType.HBAR,
      } as TransferData;

      const receiverData = {
        accountId: destinationAccountId,
        amount: 0,
        assetType: AssetType.HBAR,
      } as TransferData;

      const swap = {
        sender: senderData,
        receiver: receiverData,
      } as AtomicSwap;

      const swaps = [swap];

      const swapTokenParams = {
        atomicSwaps: swaps,
      } as AtomicSwapRequestParams;

      const response: any = await createSwapRequest(
        network,
        mirrorNodeUrl,
        swapTokenParams,
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
                placeholder="0"
                onChange={(e) =>
                  setSendHbarAmount(parseInt(e.target.value, 10))
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
