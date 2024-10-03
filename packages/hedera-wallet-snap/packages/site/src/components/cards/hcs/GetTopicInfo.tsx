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
import {
  Account,
  GetTopicInfoRequestParams,
  ServiceFee,
} from '../../../types/snap';
import { getTopicInfo, shouldDisplayReconnectButton } from '../../../utils';
import { Card, SendHelloButton } from '../../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../../sections/ExternalAccount';

type Props = {
  network: string;
  mirrorNodeUrl: string;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const GetTopicInfo: FC<Props> = ({
  network,
  mirrorNodeUrl,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [topicId, setTopicId] = useState('');

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetTopicInfoClick = async () => {
    setLoading(true);
    try {
      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const TUUMESERVICEADDRESS = '0.0.98'; // Hedera Fee collection account
      const serviceFee = {
        percentageCut: 0, // Change this if you want to charge a service fee
        toAddress: TUUMESERVICEADDRESS,
      } as ServiceFee;

      const getTopicInfoParams = {
        topicId,
        serviceFee,
      } as GetTopicInfoRequestParams;

      const response: any = await getTopicInfo(
        network,
        mirrorNodeUrl,
        getTopicInfoParams,
        externalAccountParams,
      );

      const { topicInfo, currentAccount } = response;

      setAccountInfo(currentAccount);
      console.log('Topic Info: ', topicInfo);

      showModal({
        title: 'Topic Info',
        content: JSON.stringify({ topicInfo }, null, 4),
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
        title: 'hcs/getTopicInfo',
        description: 'Get info of a topic',
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
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Get Topic Info"
            onClick={handleGetTopicInfoClick}
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

export { GetTopicInfo };
