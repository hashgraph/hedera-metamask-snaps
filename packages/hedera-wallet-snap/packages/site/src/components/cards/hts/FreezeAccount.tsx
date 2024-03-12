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
import { Account, FreezeAccountRequestParams } from '../../../types/snap';
import { freezeAccount, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import { GetExternalAccountRef } from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const FreezeAccount: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [tokenId, setTokenId] = useState('');
  const [accountId, setAccountId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleFreezeAccountClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const freezeAccountParams = {
        tokenId,
        accountId,
      } as FreezeAccountRequestParams;

      const response: any = await freezeAccount(
        network,
        mirrorNodeUrl,
        freezeAccountParams,
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
        title: 'freezeAccount',
        description:
          'Freezes transfers of the specified token for the account.',
        form: (
          <>
            <label>
              Enter the token Id to use
              <input
                type="string"
                style={{ width: '100%' }}
                value={tokenId}
                placeholder="Enter Token Id(0.0.x)"
                onChange={(e) => setTokenId(e.target.value)}
              />
            </label>
            <br />

            <label>
              Enter the account Id to freeze token transfers
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
            buttonText="Freeze Account"
            onClick={handleFreezeAccountClick}
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

export { FreezeAccount };
