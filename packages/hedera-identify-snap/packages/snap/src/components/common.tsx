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
  Address as MetamaskAddress,
  Bold as MetamaskBold,
  Box as MetamaskBox,
  Copyable as MetamaskCopyable,
  Divider as MetamaskDivider,
  Heading as MetamaskHeading,
  Link as MetamaskLink,
  Row as MetamaskRow,
  Text as MetamaskText,
} from '@metamask/snaps-sdk/jsx';

export const Box = MetamaskBox as any;
export const Heading = MetamaskHeading as any;
export const Divider = MetamaskDivider as any;
export const Row = MetamaskRow as any;
export const Text = MetamaskText as any;
export const Copyable = MetamaskCopyable as any;
export const Address = MetamaskAddress as any;
export const Link = MetamaskLink as any;
export const Bold = MetamaskBold as any;

export type CommonProps = {
  origin: string;
  network: string;
  [key: string]: any;
};

const MetamaskUI: SnapComponent<CommonProps> = ({ origin, network }) => {
  return (
    <Box>
      <Heading>Request</Heading>
      <Row label="Origin">
        <Text>{origin}</Text>
      </Row>
      <Row label="Network">
        <Text>{network}</Text>
      </Row>
      <Divider />
    </Box>
  );
};

export const CommonUI = MetamaskUI as any;
