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
import { Account, CreateSmartContractRequestParams } from '../../../types/snap';
import {
  createSmartContract,
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

const CreateSmartContract: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [gas, setGas] = useState(1000);
  const [bytecode, setBytecode] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateSmartContractClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const createSmartContractParams = {
        gas,
        bytecode,
      } as CreateSmartContractRequestParams;
      if (!_.isEmpty(adminKey)) {
        createSmartContractParams.adminKey = adminKey;
      }
      const response: any = await createSmartContract(
        network,
        mirrorNodeUrl,
        createSmartContractParams,
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
        title: 'hscs/createSmartContract',
        description: 'Create a new smart contract',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter the amount of gas to use for the transaction(Gas not used
              will be refunded)
              <input
                type="number"
                style={{ width: '100%' }}
                value={gas}
                placeholder="Enter the amount of gas(in Hbar)"
                onChange={(e) => setGas(parseFloat(e.target.value))}
              />
            </label>
            <br />
            <label>
              Enter the bytecode of the contract
              <input
                type="text"
                style={{ width: '100%' }}
                value={bytecode}
                placeholder="Byte ccode of the contract"
                onChange={(e) => setBytecode(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the admin public key for your smart contract(OPTIONAL)
              <input
                type="text"
                style={{ width: '100%' }}
                value={adminKey}
                placeholder="Enter the admin key"
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Create Smart Contract"
            onClick={handleCreateSmartContractClick}
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

export { CreateSmartContract };
