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

import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Address,
  Box,
  CommonUI,
  Copyable,
  Heading,
  Row,
  Text,
  type CommonProps,
} from './common';

type Props = CommonProps & {
  accountID: string;
  evmAddress: string;
};

const MetamaskUI: SnapComponent<Props> = ({
  origin,
  network,
  mirrorNodeUrl,
  accountID,
  evmAddress,
}) => {
  return (
    <Box>
      <CommonUI
        origin={origin}
        network={network}
        mirrorNodeUrl={mirrorNodeUrl}
      />
      <Heading>Hello!!</Heading>
      <Box>
        <Text>Account ID</Text>
        <Copyable value={accountID} />
      </Box>
      <Row
        label="EVM Address"
        tooltip="This is the EVM address that corresponds to the Hedera account ID"
      >
        <Address address={evmAddress} />
      </Row>
      <Row label="Message">
        <Text>
          You are seeing this because you interacted with the 'hello' method
        </Text>
      </Row>
    </Box>
  );
};

export const HelloUI = MetamaskUI as any;
