/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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
import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import { Account, StakeHbarRequestParams } from '../../types/snap';
import { shouldDisplayReconnectButton, stakeHbar } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const StakeHbar: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [nodeId, setNodeId] = useState<number>();
  const [accountId, setAccountId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleStakeHbarClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const stakeHbarParams = {
        accountId: accountId || undefined,
      } as StakeHbarRequestParams;
      if (Number.isFinite(nodeId)) {
        stakeHbarParams.nodeId = nodeId;
      }
      const response: any = await stakeHbar(
        network,
        mirrorNodeUrl,
        stakeHbarParams,
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
        title: 'Stake HBAR',
        description:
          'Use your Hedera snap account to stake your HBAR to a Node ID or Account ID.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter the node ID. Visit{' '}
              <a href="https://docs.hedera.com/hedera/networks/mainnet/mainnet-nodes">
                here
              </a>{' '}
              to find the node ID for the node you would like to stake to.
              <input
                type="number"
                style={{ width: '100%' }}
                value={nodeId}
                placeholder="Enter the number of the Node ID(eg. 0, 1, 2, etc.)"
                onChange={(e) => setNodeId(parseInt(e.target.value))}
              />
              <input
                type="string"
                style={{ width: '100%' }}
                value={accountId}
                placeholder="Enter Account Id(0.0.x)"
                onChange={(e) => setAccountId(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Stake"
            onClick={handleStakeHbarClick}
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

export { StakeHbar };
