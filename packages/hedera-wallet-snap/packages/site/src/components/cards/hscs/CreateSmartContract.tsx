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
import {
  Account,
  CreateSmartContractRequestParams,
  SmartContractFunctionParameter,
} from '../../../types/snap';
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
  const [gas, setGas] = useState(8000000);
  const [bytecode, setBytecode] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [constructorParameters, setConstructorParameters] = useState<
    SmartContractFunctionParameter[]
  >([]);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleAddParameter = () => {
    setConstructorParameters([
      ...constructorParameters,
      { type: 'string', value: '' },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    const newParameters = [...constructorParameters];
    newParameters.splice(index, 1);
    setConstructorParameters(newParameters);
  };

  const handleParameterChange = (
    index: number,
    field: 'type' | 'value',
    value: string | number | boolean | Uint8Array,
  ) => {
    const newParameters = [...constructorParameters];
    newParameters[index] = {
      ...newParameters[index],
      [field]: value,
    };
    setConstructorParameters(newParameters);
  };

  const handleCreateSmartContractClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const createSmartContractParams = {
        gas,
        bytecode,
      } as CreateSmartContractRequestParams;
      if (!_.isEmpty(constructorParameters)) {
        createSmartContractParams.constructorParameters = constructorParameters;
      }
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
              Enter the amount of gas to use for the transaction (Gas not used
              will be refunded)
              <input
                type="number"
                style={{ width: '100%' }}
                value={gas}
                placeholder="Enter the amount of gas (in Hbar)"
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
                placeholder="Bytecode of the contract"
                onChange={(e) => setBytecode(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the admin public key for your smart contract (OPTIONAL)
              <input
                type="text"
                style={{ width: '100%' }}
                value={adminKey}
                placeholder="Enter the admin key"
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </label>
            <br />
            <label>Constructor Parameters:</label>
            {constructorParameters.map((param, index) => (
              <div key={index}>
                <select
                  value={param.type}
                  onChange={(e) =>
                    handleParameterChange(
                      index,
                      'type',
                      e.target.value as string,
                    )
                  }
                >
                  <option value="string">String</option>
                  <option value="bytes">Bytes</option>
                  <option value="boolean">Boolean</option>
                  <option value="int">Int</option>
                  <option value="uint">Uint</option>
                </select>
                {param.type === 'bytes' ? (
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          handleParameterChange(
                            index,
                            'value',
                            new Uint8Array(reader.result as ArrayBuffer),
                          );
                        };
                        reader.readAsArrayBuffer(file);
                      }
                    }}
                  />
                ) : param.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={param.value as boolean}
                    onChange={(e) =>
                      handleParameterChange(index, 'value', e.target.checked)
                    }
                  />
                ) : (
                  <input
                    type="text"
                    value={param.value as string | number}
                    onChange={(e) => {
                      const value =
                        param.type === 'int' || param.type === 'uint'
                          ? parseInt(e.target.value)
                          : e.target.value;
                      handleParameterChange(index, 'value', value);
                    }}
                  />
                )}
                <button onClick={() => handleRemoveParameter(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button onClick={handleAddParameter}>Add Parameter</button>
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
