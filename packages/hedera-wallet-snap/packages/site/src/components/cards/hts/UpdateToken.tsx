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
import { Account, UpdateTokenRequestParams } from '../../../types/snap';
import { updateToken, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const UpdateToken: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [tokenId, setTokenId] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenMemo, setTokenMemo] = useState('');
  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [kycPublicKey, setKycPublicKey] = useState('');
  const [freezePublicKey, setFreezePublicKey] = useState('');
  const [pausePublicKey, setPausePublicKey] = useState('');
  const [wipePublicKey, setWipePublicKey] = useState('');
  const [feeSchedulePublicKey, setFeeSchedulePublicKey] = useState('');
  const [supplyPublicKey, setSupplyPublicKey] = useState('');
  const [expirationTime, setExpirationTime] = useState('');
  const [autoRenewAccountId, setAutoRenewAccountId] = useState('');
  const [autoRenewPeriod, setAutoRenewPeriod] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleUpdateTokenClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const updateTokenParams = {
        tokenId,
      } as UpdateTokenRequestParams;
      if (!_.isEmpty(tokenName)) {
        updateTokenParams.name = tokenName;
      }
      if (!_.isEmpty(tokenSymbol)) {
        updateTokenParams.symbol = tokenSymbol;
      }
      if (!_.isEmpty(tokenMemo)) {
        updateTokenParams.tokenMemo = tokenMemo;
      }
      if (!_.isEmpty(treasuryAccountId)) {
        updateTokenParams.treasuryAccountId = treasuryAccountId;
      }
      if (!_.isEmpty(adminKey)) {
        updateTokenParams.adminPublicKey = adminKey;
      }
      if (!_.isEmpty(kycPublicKey)) {
        updateTokenParams.kycPublicKey = kycPublicKey;
      }
      if (!_.isEmpty(freezePublicKey)) {
        updateTokenParams.freezePublicKey = freezePublicKey;
      }
      if (!_.isEmpty(pausePublicKey)) {
        updateTokenParams.pausePublicKey = pausePublicKey;
      }
      if (!_.isEmpty(wipePublicKey)) {
        updateTokenParams.wipePublicKey = wipePublicKey;
      }
      if (!_.isEmpty(feeSchedulePublicKey)) {
        updateTokenParams.feeSchedulePublicKey = feeSchedulePublicKey;
      }
      if (!_.isEmpty(expirationTime)) {
        updateTokenParams.expirationTime = expirationTime;
      }
      if (!_.isEmpty(autoRenewAccountId)) {
        updateTokenParams.autoRenewAccountId = autoRenewAccountId;
      }
      if (!_.isEmpty(autoRenewPeriod)) {
        updateTokenParams.autoRenewPeriod = Number(autoRenewPeriod);
      }

      const response: any = await updateToken(
        network,
        mirrorNodeUrl,
        updateTokenParams,
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
        title: 'updateToken',
        description: 'Update a token on Hedera using Hedera Token Service.',
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
              Enter the token name
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenName}
                placeholder="Token Name"
                onChange={(error) => setTokenName(error.target.value)}
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
                onChange={(error) => setTokenSymbol(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new token memo
              <input
                type="text"
                style={{ width: '100%' }}
                value={tokenMemo}
                placeholder="Token Memo"
                onChange={(error) => setTokenMemo(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new treasury account ID
              <input
                type="text"
                style={{ width: '100%' }}
                value={treasuryAccountId}
                placeholder="Enter the new treasury account id"
                onChange={(error) => setTreasuryAccountId(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new admin key
              <input
                type="text"
                style={{ width: '100%' }}
                value={adminKey}
                placeholder="Enter the new admin key"
                onChange={(error) => setAdminKey(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new supply public key
              <input
                type="text"
                style={{ width: '100%' }}
                value={supplyPublicKey}
                placeholder="Enter the supply key"
                onChange={(error) => setSupplyPublicKey(error.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the new KYC public key
              <input
                type="text"
                style={{ width: '100%' }}
                value={kycPublicKey}
                placeholder="Enter the kyc key"
                onChange={(error) => setKycPublicKey(error.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the new freeze public key
              <input
                type="text"
                style={{ width: '100%' }}
                value={freezePublicKey}
                placeholder="Enter the freeze key"
                onChange={(error) => setFreezePublicKey(error.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the new pause public key
              <input
                type="text"
                style={{ width: '100%' }}
                value={pausePublicKey}
                placeholder="Enter the pause key"
                onChange={(error) => setPausePublicKey(error.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the new wipe public key
              <input
                type="text"
                style={{ width: '100%' }}
                value={wipePublicKey}
                placeholder="Enter the wipe key"
                onChange={(error) => setWipePublicKey(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new Fee Schedule Public Key
              <input
                type="text"
                style={{ width: '100%' }}
                value={feeSchedulePublicKey}
                placeholder="Enter the fee schedule key"
                onChange={(error) =>
                  setFeeSchedulePublicKey(error.target.value)
                }
              />
            </label>
            <br />
            <label>
              Enter the new expiration time
              <input
                type="text"
                style={{ width: '100%' }}
                value={expirationTime}
                placeholder="Enter the new expiration time"
                onChange={(error) => setExpirationTime(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new auto renew account id
              <input
                type="text"
                style={{ width: '100%' }}
                value={autoRenewAccountId}
                placeholder="Enter the new auto renew account id"
                onChange={(error) => setAutoRenewAccountId(error.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new auto renew period
              <input
                type="text"
                style={{ width: '100%' }}
                value={autoRenewPeriod}
                placeholder="Enter the new auto renew period"
                onChange={(error) => setAutoRenewPeriod(error.target.value)}
              />
            </label>
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Update Token"
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

export { UpdateToken };
