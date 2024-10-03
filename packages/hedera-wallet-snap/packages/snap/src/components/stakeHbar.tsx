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

import { Hbar, HbarUnit } from '@hashgraph/sdk';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import type { MirrorStakingInfo } from '../types/hedera';
import { Utils } from '../utils/Utils';
import {
  Box,
  CommonUI,
  Copyable,
  Divider,
  Heading,
  Link,
  Text,
  type CommonProps,
} from './common';

type Props = CommonProps & {
  nodeId: string | null;
  accountId: string | null;
  stakingInfo: MirrorStakingInfo;
};

const MetamaskUI: SnapComponent<Props> = ({
  origin,
  network,
  mirrorNodeUrl,
  nodeId,
  accountId,
  stakingInfo,
}) => {
  const hasNodeId = nodeId !== null;
  const hasAccountId = accountId !== null;

  let content = (
    <Box>
      <CommonUI
        origin={origin}
        network={network}
        mirrorNodeUrl={mirrorNodeUrl}
      />
      <Heading>Stake/Unstake HBAR</Heading>
      <Text>
        Refer to this
        <Link href="https://docs.hedera.com/hedera/core-concepts/staking">
          guide
        </Link>
        for more information on staking HBAR'
      </Text>
      <Divider />
    </Box>
  );
  if (!hasNodeId && !hasAccountId) {
    content = (
      <Box>
        {content}
        <Text>
          You are about to unstake your HBAR so you will not be receiving any
          staking rewards from here on out.
        </Text>
      </Box>
    );
  } else {
    content = (
      <Box>
        {content}
        <Text>You are about to stake your HBAR to the following:</Text>
        <Divider />
        {hasAccountId && (
          <Box>
            <Heading>Staking to Account ID:</Heading>
            <Copyable value={accountId} />
            <Divider />
          </Box>
        )}
        {hasNodeId && (
          <Box>
            <Heading>Staking to Node ID:</Heading>
            <Copyable value={nodeId} />
            <Text>Node Description: {stakingInfo.description}</Text>
            <Text>Node Account ID: {stakingInfo.node_account_id}</Text>
            <Text>
              Total Stake:{' '}
              {Hbar.from(stakingInfo.stake, HbarUnit.Tinybar).toString()}{' '}
            </Text>
            <Text>
              Staking Start:{' '}
              {Utils.timestampToString(stakingInfo.staking_period.from)}
            </Text>
            <Text>
              Staking End:{' '}
              {Utils.timestampToString(stakingInfo.staking_period.to)}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  return content;
};

export const StakeHbarUI = MetamaskUI as any;
