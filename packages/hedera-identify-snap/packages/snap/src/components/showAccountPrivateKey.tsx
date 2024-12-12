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
  privateKey: string;
  publicKey: string;
  evmAddress: string;
};

const MetamaskUI: SnapComponent<Props> = ({
  origin,
  network,
  privateKey,
  publicKey,
  evmAddress,
}) => {
  return (
    <Box>
      <CommonUI origin={origin} network={network} />
      <Heading>Show Account Private Key</Heading>
      <Row label="EVM Address">
        <Address address={evmAddress} />
      </Row>
      <Box>
        <Text>Public Key</Text>
        <Copyable value={publicKey} />
      </Box>
      <Row label="Warning" variant="warning">
        <Text>
          Never disclose this key. Anyone with your private keys can steal any
          assets held in your account
        </Text>
      </Row>
      <Box>
        <Text>Private Key</Text>
        <Copyable value={privateKey} sensitive />
      </Box>
    </Box>
  );
};

export const ShowAccountPrivateKeyUI = MetamaskUI as any;
