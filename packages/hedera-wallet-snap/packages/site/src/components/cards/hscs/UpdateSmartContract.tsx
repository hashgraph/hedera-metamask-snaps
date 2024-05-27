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
import { Account, UpdateSmartContractRequestParams } from '../../../types/snap';
import {
  shouldDisplayReconnectButton,
  updateSmartContract,
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

const UpdateSmartContract: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [contractId, setContractId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [contractMemo, setContractMemo] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleUpdateSmartContractClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const updateSmartContractParams = {
        contractId,
      } as UpdateSmartContractRequestParams;
      if (!_.isEmpty(adminKey)) {
        updateSmartContractParams.adminKey = adminKey;
      }
      if (!_.isEmpty(contractMemo)) {
        updateSmartContractParams.contractMemo = contractMemo;
      }
      const response: any = await updateSmartContract(
        network,
        mirrorNodeUrl,
        updateSmartContractParams,
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
        title: 'hscs/updateSmartContract',
        description: 'Update a smart contract',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter the Contract ID:
              <input
                type="text"
                style={{ width: '100%' }}
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new admin key (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the new contract memo (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={contractMemo}
                onChange={(e) => setContractMemo(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Update Smart Contract"
            onClick={handleUpdateSmartContractClick}
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

export { UpdateSmartContract };
