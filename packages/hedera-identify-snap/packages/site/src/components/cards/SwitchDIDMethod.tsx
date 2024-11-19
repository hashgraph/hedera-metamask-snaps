/*-
 *
 * Hedera Identify Snap
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

import { FC, useContext, useState } from 'react';
import Form from 'react-bootstrap/esm/Form';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import {
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  shouldDisplayReconnectButton,
  switchDIDMethod,
} from '../../utils';
import { Card, SendHelloButton } from '../base';

type Props = {
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setCurrentChainId: React.Dispatch<React.SetStateAction<string>>;
};

const SwitchDIDMethod: FC<Props> = ({
  setMetamaskAddress,
  setCurrentChainId,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [didMethod, setDidMethod] = useState('did:pkh'); // Default method is 'did:pkh'
  const [loading, setLoading] = useState(false);

  const handleswitchDIDMethodClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const switched = await switchDIDMethod(didMethod);
      console.log(`DID Method switched : ${switched}`);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'switchDIDMethod',
        description: 'Select and switch DID Method to use',
        form: (
          <>
            <Form.Check
              type="radio"
              label="did:pkh (default)"
              name="didMethod"
              value="did:pkh"
              checked={didMethod === 'did:pkh'}
              onChange={(e) => setDidMethod(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Form.Check
              type="radio"
              label="did:key"
              name="didMethod"
              value="did:key"
              checked={didMethod === 'did:key'}
              onChange={(e) => setDidMethod(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Form.Check
              type="radio"
              label="did:hedera"
              name="didMethod"
              value="did:hedera"
              checked={didMethod === 'did:hedera'}
              onChange={(e) => setDidMethod(e.target.value)}
              style={{ marginBottom: 8 }}
            />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Switch DID Method"
            onClick={handleswitchDIDMethodClick}
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

export { SwitchDIDMethod };
