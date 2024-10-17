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

import { FC, useContext } from 'react';
import { MetaMaskContext } from '../../contexts/MetamaskContext';
import { shouldDisplayReconnectButton } from '../../utils';
import { Card, ReconnectButton } from '../base';

type Props = {
  handleConnectClick: () => Promise<void>;
};

const ReconnectIdentitySnap: FC<Props> = ({ handleConnectClick }) => {
  const [state] = useContext(MetaMaskContext);

  return shouldDisplayReconnectButton(state.installedSnap) ? (
    <Card
      content={{
        title: 'Reconnect to Identify Snap',
        description:
          "While connected to a local running snap, this button will always be displayed in order to update the snap if a change is made. Note that you'll need to reconnect if you switch the network on Metamask at any point in time as that will cause your metamask state to change",
        button: (
          <ReconnectButton
            onClick={handleConnectClick}
            disabled={!state.installedSnap}
          />
        ),
      }}
      disabled={!state.installedSnap}
    />
  ) : null;
};

export { ReconnectIdentitySnap };
