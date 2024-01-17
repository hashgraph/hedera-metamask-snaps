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
import { verifyMessage } from 'ethers';
import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import { Account, SignMessageRequestParams } from '../../types/snap';
import { shouldDisplayReconnectButton, signMessage } from '../../utils';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SignMessage: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [message, setMessage] = useState('Hello, Hedera!');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleSignMessageClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const signMessageParams = {
        message,
      } as SignMessageRequestParams;
      const response: any = await signMessage(
        network,
        mirrorNodeUrl,
        signMessageParams,
        externalAccountParams,
      );

      const { signature, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('signature: ', signature);

      // Let's try to verify whether this signature is valid
      // Recover address from signature
      const addressInSignature = verifyMessage(
        message,
        signature,
      ).toLowerCase();
      console.log('addressInSignature: ', addressInSignature);

      showModal({
        title: 'Signed Message',
        content: JSON.stringify(
          { message, signature, addressInSignature },
          null,
          4,
        ),
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
        title: 'Sign arbitary message',
        description:
          'Use your Hedera snap account to sign an arbitary message.',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Enter an arbitary message to sign
              <input
                type="text"
                style={{ width: '100%' }}
                value={message}
                placeholder="Hello, Hedera!"
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Sign"
            onClick={handleSignMessageClick}
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

export { SignMessage };
