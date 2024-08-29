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
import type { TxRecord } from '../types/hedera';
import {
  Bold,
  Box,
  CommonUI,
  Copyable,
  Divider,
  Heading,
  Link,
  Row,
  Text,
  type CommonProps,
} from './common';

type Props = CommonProps & {
  result: TxRecord;
};

const MetamaskUI: SnapComponent<Props> = ({
  origin,
  network,
  mirrorNodeUrl,
  result,
}) => {
  const status = result.receipt.status === 'SUCCESS' ? 'Succeeded' : 'Failed';
  let content = (
    <Box>
      <CommonUI
        origin={origin}
        network={network}
        mirrorNodeUrl={mirrorNodeUrl}
      />
      <Heading>Transaction {status}</Heading>
      <Box>
        <Text>Transaction ID</Text>
        <Copyable value={result.transactionId} />
      </Box>
    </Box>
  );
  if (result.receipt.status === 'SUCCESS') {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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

export const PostTransactionUI = MetamaskUI as any;
