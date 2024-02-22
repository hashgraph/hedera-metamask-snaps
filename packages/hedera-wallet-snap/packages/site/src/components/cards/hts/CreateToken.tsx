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
import { Account, CreateTokenRequestParams } from '../../../types/snap';
import { createToken, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const CreateToken: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [assetType, setAssetType] = useState<'TOKEN' | 'NFT'>('TOKEN');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(1);
  const [initialSupply, setInitialSupply] = useState(100);
  const [supplyPublicKey, setSupplyPublicKey] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateTokenClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const createTokenParams = {
        assetType,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: assetType === 'NFT' ? 0 : tokenDecimals,
        supplyType: 'INFINITE',
        initialSupply: assetType === 'NFT' ? 0 : initialSupply,
      } as CreateTokenRequestParams;
      if (assetType === 'NFT') {
        createTokenParams.supplyPublicKey = supplyPublicKey;
      }
      const response: any = await createToken(
        network,
        mirrorNodeUrl,
        createTokenParams,
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
        title: 'createToken',
        description: 'Create a token on Hedera using Hedera Token Service.',
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
              Enter the name for your token/NFT
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenName}
                placeholder="Token Name"
                onChange={(e) => setTokenName(e.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the symbol for your token/NFT
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenSymbol}
                placeholder="Token Symbol"
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
            </label>
            <br />

            {assetType === 'TOKEN' && (
              <>
                <label>
                  Enter the decimals for your token
                  <input
                    type="number"
                    style={{ width: '100%' }}
                    value={tokenDecimals}
                    placeholder="Enter the number of decimals"
                    onChange={(e) =>
                      setTokenDecimals(parseFloat(e.target.value))
                    }
                  />
                </label>
                <br />
                <label>
                  Enter the initial supply for your token
                  <input
                    type="number"
                    style={{ width: '100%' }}
                    value={initialSupply}
                    placeholder="Enter the amount of initial supply"
                    onChange={(e) =>
                      setInitialSupply(parseFloat(e.target.value))
                    }
                  />
                </label>
                <br />
              </>
            )}

            {assetType === 'NFT' && (
              <>
                <label>
                  Enter the supply public key for your NFT
                  <input
                    type="text"
                    style={{ width: '100%' }}
                    value={supplyPublicKey}
                    placeholder="Enter the supply key"
                    onChange={(e) => setSupplyPublicKey(e.target.value)}
                  />
                </label>
                <br />
              </>
            )}
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

export { CreateToken };
