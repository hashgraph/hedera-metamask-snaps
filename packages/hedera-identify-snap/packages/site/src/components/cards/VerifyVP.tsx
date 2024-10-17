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
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import { VcContext } from '../../contexts/VcContext';
import useModal from '../../hooks/useModal';
import {
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  shouldDisplayReconnectButton,
  verifyVP,
} from '../../utils';
import { Card, SendHelloButton, TextInput } from '../base';

type Props = {
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setCurrentChainId: React.Dispatch<React.SetStateAction<string>>;
};

const VerifyVP: FC<Props> = ({ setMetamaskAddress, setCurrentChainId }) => {
  const { vp, setVp } = useContext(VcContext);
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const handleVerifyVPClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const verified = await verifyVP(metamaskAddress, vp);
      console.log('VP Verified: ', verified);
      showModal({
        title: 'Verify VP',
        content: `VP Verified: ${verified}`,
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
        title: 'verifyVP',
        description: 'Verify a VP JWT or LDS format',
        form: (
          <label>
            Enter your Verifiable Presentation
            <TextInput
              rows={2}
              value={JSON.stringify(vp)}
              onChange={(e) => setVp(e.target.value)}
              fullWidth
            />
          </label>
        ),
        button: (
          <SendHelloButton
            buttonText="Verify VP"
            onClick={handleVerifyVPClick}
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

export { VerifyVP };
