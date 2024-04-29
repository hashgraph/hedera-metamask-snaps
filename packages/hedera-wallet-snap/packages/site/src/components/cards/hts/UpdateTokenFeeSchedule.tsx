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

import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../../contexts/MetamaskContext';
import useModal from '../../../hooks/useModal';
import { Account, TokenCustomFee } from '../../../types/snap';
import {
  shouldDisplayReconnectButton,
  updateTokenFeeSchedule,
} from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const UpdateTokenFeeSchedule: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [tokenId, setTokenId] = useState('');
  const [feeCollectorAccountId, setTokenFeeCollectorAccountId] = useState('');
  const [hbarAmount, setHbarAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [denominatingTokenId, setDenominatingTokenId] = useState('');
  const [allCollectorsAreExempt, setCollectorsExempt] = useState(false);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleUpdateTokenClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const numberHbarAmount = Number(hbarAmount);
      const numberTokenAmount = Number(tokenAmount);
      const booleanAllCollectors = Boolean(allCollectorsAreExempt);

      const tokenCustomFee = {
        feeCollectorAccountId,
      } as TokenCustomFee;

      if (hbarAmount) {
        tokenCustomFee.hbarAmount = numberHbarAmount;
      }
      if (tokenAmount) {
        tokenCustomFee.tokenAmount = numberTokenAmount;
      }
      if (denominatingTokenId) {
        tokenCustomFee.denominatingTokenId = denominatingTokenId;
      }
      if (allCollectorsAreExempt) {
        tokenCustomFee.allCollectorsAreExempt = booleanAllCollectors;
      }

      const customFees = [tokenCustomFee];

      const updateTokenFeeScheduleParams = {
        tokenId,
        customFees,
      };

      const response: any = await updateTokenFeeSchedule(
        network,
        mirrorNodeUrl,
        updateTokenFeeScheduleParams,
        externalAccountParams,
      );

      const { receipt, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('receipt: ', receipt);

      showModal({
        title: 'Transaction Receipt',
        content: JSON.stringify({ receipt }, null, 4),
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'updateTokenFeeSchedule',
        description: `Update a token's fee schedule on Hedera using Hedera Token Service.`,
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter the token id
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenId}
                placeholder="Token ID"
                onChange={(error) => setTokenId(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the fee collector account id that collects the fee
              <input
                type="text"
                style={{ width: '100%' }}
                value={feeCollectorAccountId}
                placeholder="Collector Account ID"
                onChange={(error) =>
                  setTokenFeeCollectorAccountId(error.target.value)
                }
              />
            </label>
            <br />
            <label>
              Enter the hbar amount to be collected
              <input
                type="text"
                style={{ width: '100%' }}
                value={hbarAmount}
                placeholder="HBar Amount"
                onChange={(error) => setHbarAmount(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new token amount to be collected as the fee
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenAmount}
                placeholder="Token Amount"
                onChange={(error) => setTokenAmount(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the denominating token id used to charge the fee
              <input
                type="text"
                style={{ width: '100%' }}
                value={denominatingTokenId}
                placeholder="Enter the new treasury account id"
                onChange={(error) => setDenominatingTokenId(error.target.value)}
              />
            </label>
            <br />
            <label>
              Select whether collectors are exempt
              <input
                type="checkbox"
                style={{ width: '100%' }}
                value={allCollectorsAreExempt ? 'true' : 'false'}
                placeholder="Are all collectors exempt?"
                onChange={(changeEvent) =>
                  setCollectorsExempt(changeEvent.target.checked)
                }
              />
            </label>
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Update Token Fee Schedule"
            onClick={handleUpdateTokenClick}
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

export { UpdateTokenFeeSchedule };
