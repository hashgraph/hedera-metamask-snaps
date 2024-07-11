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
import { Account, CreateTopicRequestParams } from '../../../types/snap';
import { createTopic, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const CreateTopic: FC<Props> = ({ network, mirrorNodeUrl, setAccountInfo }) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [memo, setMemo] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [submitKey, setSubmitKey] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateTopicClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const createTopicParams = {
        memo: memo || undefined,
        adminKey: adminKey || undefined,
        submitKey: submitKey || undefined,
      } as CreateTopicRequestParams;

      const response: any = await createTopic(
        network,
        mirrorNodeUrl,
        createTopicParams,
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
        title: 'hcs/createTopic',
        description: 'Create a new topic',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Memo (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={memo}
                placeholder="Enter memo"
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>
            <br />
            <label>
              Admin Key (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={adminKey}
                placeholder="Enter admin key"
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </label>
            <br />
            <label>
              Submit Key (optional):
              <input
                type="text"
                style={{ width: '100%' }}
                value={submitKey}
                placeholder="Enter submit key"
                onChange={(e) => setSubmitKey(e.target.value)}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Create Topic"
            onClick={handleCreateTopicClick}
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

export { CreateTopic };
