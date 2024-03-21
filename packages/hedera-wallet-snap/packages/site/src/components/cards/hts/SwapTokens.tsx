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
import { Account, SwapTokensRequestParams } from '../../../types/snap';
import { swapTokens, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SwapTokens: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [destinationAccountId, setAssetType] = useState('');
  const [tokenId, setTokenName] = useState('');
  const [tokenAmount, setTokenSymbol] = useState('');
  const [hbarAmount, setTokenDecimals] = useState(1);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateTokenClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const swapTokenParams = {
        destinationAccountId,
        tokenId,
      } as SwapTokensRequestParams;

      if (Number.isFinite(tokenAmount)) {
        swapTokenParams.tokenAmount = Number(tokenAmount);
      }

      if (Number.isFinite(hbarAmount)) {
        swapTokenParams.hbarAmount = Number(hbarAmount);
      }

      const response: any = await swapTokens(
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
        title: 'swapTokens',
        description: 'Swap tokens on Hedera using the Hedera Token Service.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <br />
            <label>
              Enter the Account ID to send tokens to
              <input
                type="text"
                style={{ width: '100%' }}
                value={destinationAccountId}
                placeholder="0.0.1234"
                onChange={(e) => setTokenName(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the amount of Hbar to send
              <input
                type="text"
                style={{ width: '100%' }}
                value={hbarAmount}
                placeholder="1"
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the token ID
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenId}
                placeholder="0.0"
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the token amount
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenAmount}
                placeholder="1"
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Create Token"
            onClick={handleCreateTokenClick}
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

export { SwapTokens };
