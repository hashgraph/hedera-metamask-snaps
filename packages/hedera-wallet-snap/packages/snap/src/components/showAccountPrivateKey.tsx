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
  Address as MetamaskAddress,
  Box as MetamaskBox,
  Copyable as MetamaskCopyable,
  Heading as MetamaskHeading,
  Row as MetamaskRow,
  Text as MetamaskText,
} from '@metamask/snaps-sdk/jsx';
import type { BasicFormProps } from './common';

const Box = MetamaskBox as any;
const Heading = MetamaskHeading as any;
const Row = MetamaskRow as any;
const Text = MetamaskText as any;
const Copyable = MetamaskCopyable as any;
const Address = MetamaskAddress as any;

type ShowAccountPrivateKeyProps = BasicFormProps & {
  privateKey: string;
  publicKey: string;
  accountID: string;
  evmAddress: string;
};

export const ShowAccountPrivateKeyForm: SnapComponent<
  ShowAccountPrivateKeyProps
> = ({
  origin,
  network,
  mirrorNodeUrl,
  privateKey,
  publicKey,
  accountID,
  evmAddress,
}) => {
  return (
    <Box>
      <Heading>Request from {origin}!</Heading>
      <Row label="Network">
        <Text>{network}</Text>
      </Row>
      <Row label="Mirror Node">
        <Text>{mirrorNodeUrl}</Text>
      </Row>
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
