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
} from '../../../contexts/MetamaskContext';
import useModal from '../../../hooks/useModal';
import { Account, MintTokenRequestParams } from '../../../types/snap';
import { mintToken, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const MintToken: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [assetType, setAssetType] = useState<'TOKEN' | 'NFT'>('TOKEN');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState<number>();
  const [metadata, setMetadata] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleMintTokenClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const mintTokenParams = {
        assetType,
        tokenId,
      } as MintTokenRequestParams;
      if (assetType === 'NFT') {
        mintTokenParams.metadata = metadata;
      } else {
        if (Number.isFinite(amount)) {
          mintTokenParams.amount = amount;
        }
      }

      const response: any = await mintToken(
        network,
        mirrorNodeUrl,
        mintTokenParams,
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
        title: 'mintToken',
        description:
          'Mint a fungible/non-fungible tokens to the Treasury account id.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Asset Type
              <select
                style={{ width: '100%' }}
                value={assetType}
                onChange={(e) =>
                  setAssetType(e.target.value as 'TOKEN' | 'NFT')
                }
              >
                <option value="TOKEN">TOKEN</option>
                <option value="NFT">NFT</option>
              </select>
            </label>
            <br />

            <label>
              Enter the token Id for your token
              <input
                type="string"
                style={{ width: '100%' }}
                value={tokenId}
                placeholder="Enter Token Id(0.0.x)"
                onChange={(e) => setTokenId(e.target.value)}
              />
            </label>
            <br />

            {assetType === 'TOKEN' && (
              <>
                <label>
                  Enter the amount of tokens to mint.{' '}
                  <input
                    type="number"
                    style={{ width: '100%' }}
                    value={amount}
                    placeholder="Enter the amount of tokens"
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                  />
                </label>
                <br />
              </>
            )}

            {assetType === 'NFT' && (
              <>
                <label>
                  Enter the metadata field for your NFT. Once minted, the
                  metadata cannot be changed and is immutable.{' '}
                  <input
                    type="string"
                    style={{ width: '100%' }}
                    value={metadata}
                    placeholder="Enter metadata"
                    onChange={(e) => setMetadata(e.target.value)}
                  />
                </label>
                <br />
              </>
            )}
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Mint"
            onClick={handleMintTokenClick}
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

export { MintToken };
