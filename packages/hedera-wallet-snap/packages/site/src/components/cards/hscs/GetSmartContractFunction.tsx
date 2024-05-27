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
  GetSmartContractFunctionRequestParams,
} from '../../../types/snap';
import {
  getSmartContractFunction,
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

const GetSmartContractFunction: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [contractId, setContractId] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [functionParams, setFunctionParams] = useState('');
  const [gas, setGas] = useState(100000);

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetSmartContractFunctionClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const getSmartContractFunctionParams = {
        contractId,
        functionName,
        gas,
      } as GetSmartContractFunctionRequestParams;
      if (!_.isEmpty(functionParams)) {
        getSmartContractFunctionParams.functionParams = functionParams;
      }
      const response: any = await getSmartContractFunction(
        network,
        mirrorNodeUrl,
        getSmartContractFunctionParams,
        externalAccountParams,
      );

      const { result, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('result: ', result);

      showModal({
        title: 'Function Result',
        content: JSON.stringify({ result }, null, 4),
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
        title: 'hscs/getSmartContractFunction',
        description: 'Get a smart contract function result',
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
              Enter the Function Name:
              <input
                type="text"
                style={{ width: '100%' }}
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the Function Parameters:
              <textarea
                style={{ width: '100%' }}
                value={functionParams}
                onChange={(e) => setFunctionParams(e.target.value)}
              />
            </label>
            <br />
            <label>
              Enter the amount of gas to use for the query:
              <input
                type="number"
                style={{ width: '100%' }}
                value={gas}
                placeholder="Enter the amount of gas"
                onChange={(e) => setGas(parseFloat(e.target.value))}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Get Smart Contract Function Result"
            onClick={handleGetSmartContractFunctionClick}
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

export { GetSmartContractFunction };
