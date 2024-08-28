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
  Bold as MetamaskBold,
  Box as MetamaskBox,
  Copyable as MetamaskCopyable,
  Divider as MetamaskDivider,
  Heading as MetamaskHeading,
  Link as MetamaskLink,
  Row as MetamaskRow,
  Text as MetamaskText,
} from '@metamask/snaps-sdk/jsx';
import type { TxRecord } from '../types/hedera';
import type { BasicFormProps } from './common';

const Box = MetamaskBox as any;
const Heading = MetamaskHeading as any;
const Row = MetamaskRow as any;
const Text = MetamaskText as any;
const Copyable = MetamaskCopyable as any;
const Link = MetamaskLink as any;
const Divider = MetamaskDivider as any;
const Bold = MetamaskBold as any;

type PostTransactionProps = BasicFormProps & {
  result: TxRecord;
};

export const PostTransactionForm: SnapComponent<PostTransactionProps> = ({
  origin,
  network,
  mirrorNodeUrl,
  result,
}) => {
  const status = result.receipt.status === 'SUCCESS' ? 'Succeeded' : 'Failed';
  let content = (
    <Box>
      <Heading>Transaction {status}</Heading>
      <Row label="Origin">
        <Text>{origin}</Text>
      </Row>
      <Row label="Network">
        <Text>{network}</Text>
      </Row>
      <Row label="Mirror Node">
        <Text>{mirrorNodeUrl}</Text>
      </Row>
      <Box>
        <Text>Transaction ID</Text>
        <Copyable value={result.transactionId} />
      </Box>
    </Box>
  );
  if (result.receipt.status === 'SUCCESS') {
    const link = `https://hashscan.io/${network}/transaction/${result.transactionId}`;
    content = (
      <Box>
        {content}
        <Box>
          <Text>
            View on <Link href={link}>Hashscan</Link>
          </Text>
        </Box>
        <Box>
          <Text>Transaction Hash</Text>
          <Copyable value={result.transactionHash} />
        </Box>
        <Row label="Transaction Fee">
          <Text>{result.transactionFee}</Text>
        </Row>
        <Row label="Transaction Time">
          <Text>{result.consensusTimestamp}</Text>
        </Row>
        <Divider />
        <Heading>Transfers:</Heading>
        {result.transfers.map((transfer) => (
          <Box>
            <Text>
              <Bold>Transferred</Bold> ${transfer.amount} Hbar to{' '}
              {transfer.accountId}
            </Text>
          </Box>
        ))}
      </Box>
    );
  }
  return content;
};
