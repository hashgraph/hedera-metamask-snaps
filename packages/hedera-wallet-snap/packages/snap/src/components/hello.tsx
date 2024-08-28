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
  Box as MetamaskBox,
  Heading as MetamaskHeading,
  Row as MetamaskRow,
  Text as MetamaskText,
} from '@metamask/snaps-sdk/jsx';
import type { BasicFormProps } from './common';

const Box = MetamaskBox as any;
const Heading = MetamaskHeading as any;
const Row = MetamaskRow as any;
const Text = MetamaskText as any;

type HelloProps = BasicFormProps & {
  accountID: string;
  evmAddress: string;
};

export const HelloForm: SnapComponent<HelloProps> = ({
  origin,
  network,
  mirrorNodeUrl,
  accountID,
  evmAddress,
}) => {
  return (
    <Box>
      <Heading>Hello from {origin}!</Heading>
      <Row label="Network">
        <Text>{network}</Text>
      </Row>
      <Row label="Mirror Node">
        <Text>{mirrorNodeUrl}</Text>
      </Row>
      <Row label="Account ID" tooltip="This is your Hedera Account ID">
        <Text>{accountID}</Text>
      </Row>
      <Row
        label="EVM Address"
        tooltip="This is the EVM address that corresponds to the Hedera account ID"
      >
        <Text>{evmAddress}</Text>
      </Row>
      <Row label="Message">
        <Text>
          You are seeing this because you interacted with the 'hello' method
        </Text>
      </Row>
    </Box>
  );
};
