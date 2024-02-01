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
import {
  Account,
  ApproveAllowanceAssetDetail,
  ApproveAllowanceRequestParams,
} from '../../types/snap';
import { approveAllowance, shouldDisplayReconnectButton } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const ApproveAllowance: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [spenderAccountId, setSpenderAccountId] = useState('');
  const [amount, setAmount] = useState<number>();
  const [assetType, setAssetType] = useState<'HBAR' | 'TOKEN' | 'NFT'>('HBAR');
  const [assetId, setAssetId] = useState('');
  const [approveAll, setApproveAll] = useState<boolean>(false);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleApproveAllowanceClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const approveAllowanceParams = {
        spenderAccountId,
        amount,
        assetType,
      } as ApproveAllowanceRequestParams;
      if (assetType === 'TOKEN' || assetType === 'NFT') {
        approveAllowanceParams.assetDetail = {
          assetId,
          approveAll,
        } as ApproveAllowanceAssetDetail;
      }
      const response: any = await approveAllowance(
        network,
        mirrorNodeUrl,
        approveAllowanceParams,
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
        title: 'approveAllowance',
        description:
          'Use your Hedera snap account to approve an allowance to another Account.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter the spender Account ID.
              <input
                type="text"
                style={{ width: '100%' }}
                value={spenderAccountId}
                placeholder="Enter Account Id(0.0.x)"
                onChange={(e) => setSpenderAccountId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the amount to be allowed to be spent
              <input
                type="number"
                style={{ width: '100%' }}
                value={amount || ''}
                placeholder="Enter the amount"
                onChange={(e) => setAmount(parseFloat(e.target.value))}
              />
            </label>
            <br />
            <label>
              Asset Type
              <select
                style={{ width: '100%' }}
                value={assetType}
                onChange={(e) =>
                  setAssetType(e.target.value as 'HBAR' | 'TOKEN' | 'NFT')
                }
              >
                <option value="HBAR">HBAR</option>
                <option value="TOKEN">TOKEN</option>
                <option value="NFT">NFT</option>
              </select>
            </label>
            <br />
            {(assetType === 'TOKEN' || assetType === 'NFT') && (
              <label>
                Enter Asset Id (eg. Token Id, NFT Id)
                <input
                  type="text"
                  style={{ width: '100%' }}
                  value={assetId}
                  placeholder="Enter Asset Id"
                  onChange={(e) => setAssetId(e.target.value)}
                />
              </label>
            )}
            {assetType === 'NFT' && (
              <label>
                Approve All NFTs in this collection{' '}
                <input
                  type="checkbox"
                  checked={approveAll}
                  onChange={(e) => setApproveAll(e.target.checked)}
                />
              </label>
            )}
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Approve an Allowance"
            onClick={handleApproveAllowanceClick}
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

export { ApproveAllowance };
