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
import { Account, GetTopicMessagesRequestParams } from '../../../types/snap';
import { getTopicMessages, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const GetTopicMessages: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [topicId, setTopicId] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState<number>();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetTopicMessagesClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const getTopicMessagesParams = {
        topicId,
      } as GetTopicMessagesRequestParams;
      if (sequenceNumber && Number.isFinite(sequenceNumber)) {
        getTopicMessagesParams.sequenceNumber = sequenceNumber;
      }

      const response: any = await getTopicMessages(
        network,
        mirrorNodeUrl,
        getTopicMessagesParams,
        externalAccountParams,
      );

      const { topicMessages, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('Topic Messages: ', topicMessages);

      showModal({
        title: 'Topic Messages',
        content: JSON.stringify({ topicMessages }, null, 4),
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
        title: 'hcs/getTopicMessages',
        description: 'Get topic messages using topic ID and/or sequence number',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            <label>
              Topic ID:
              <input
                type="text"
                style={{ width: '100%' }}
                value={topicId}
                placeholder="Enter topic ID"
                onChange={(e) => setTopicId(e.target.value)}
              />
            </label>
            <br />
            <label>
              Sequence number:
              <input
                type="number"
                style={{ width: '100%' }}
                value={sequenceNumber}
                placeholder="Enter the sequence number"
                onChange={(e) => setSequenceNumber(parseInt(e.target.value))}
              />
            </label>
            <br />
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Get Topic Messages"
            onClick={handleGetTopicMessagesClick}
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

export { GetTopicMessages };
