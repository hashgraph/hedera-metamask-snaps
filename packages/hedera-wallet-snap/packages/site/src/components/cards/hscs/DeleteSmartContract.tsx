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
import { Account, DeleteSmartContractRequestParams } from '../../../types/snap';
import {
  deleteSmartContract,
  shouldDisplayReconnectButton,
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

const DeleteSmartContract: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [contractId, setContractId] = useState('');
  const [transferAccountId, setTransferAccountId] = useState('');
  const [transferContractId, setTransferContractId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleDeleteSmartContractClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();
      const deleteSmartContractParams = {
        contractId,
      } as DeleteSmartContractRequestParams;
      if (!_.isEmpty(transferAccountId)) {
        deleteSmartContractParams.transferAccountId = transferAccountId;
      }
      if (!_.isEmpty(transferContractId)) {
        deleteSmartContractParams.transferContractId = transferContractId;
      }
      const response: any = await deleteSmartContract(
        network,
        mirrorNodeUrl,
        deleteSmartContractParams,
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
        title: 'hscs/deleteSmartContract',
        description: 'Delete a smart contract',
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
              Enter the Transfer Account ID (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={transferAccountId}
                onChange={(e) => setTransferAccountId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the Transfer Contract ID (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={transferContractId}
                onChange={(e) => setTransferContractId(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Delete Smart Contract"
            onClick={handleDeleteSmartContractClick}
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

export { DeleteSmartContract };
