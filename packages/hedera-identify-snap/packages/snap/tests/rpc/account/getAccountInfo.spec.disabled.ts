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

/* eslint-disable no-restricted-globals */

import { MetaMaskInpageProvider } from '@metamask/providers';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import {
  EvmAccountParams,
  HederaAccountParams,
  PublicAccountInfo,
} from 'src/interfaces';
import { onRpcRequest } from '../../../src';
import {
  ETH_ADDRESS,
  ETH_CHAIN_ID,
  EVM_ACCOUNT,
  getDefaultSnapState,
  HEDERA_ACCOUNT,
  HEDERA_CHAIN_ID,
} from '../../testUtils/constants';
import { getRequestParams } from '../../testUtils/helper';
import { buildMockSnap, SnapMock } from '../../testUtils/snap.mock';

describe('getAccountInfo', () => {
  let snapMock: SnapsGlobalObject & SnapMock;
  let metamask: MetaMaskInpageProvider;

  describe('getAccountInfo Ethereum', () => {
    beforeAll(async () => {
      snapMock = buildMockSnap(ETH_CHAIN_ID, ETH_ADDRESS);
      metamask = snapMock as unknown as MetaMaskInpageProvider;

      global.snap = snapMock;
      global.ethereum = metamask;
    });

    beforeEach(async () => {
      snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
      snapMock.rpcMocks.snap_manageState.mockReturnValue(getDefaultSnapState());
      snapMock.rpcMocks.snap_manageState('update', getDefaultSnapState());
    });

    it('getAccountInfo', async () => {
      const accountInfoRequestParams = getRequestParams('getAccountInfo', {});

      const accountInfo = (await onRpcRequest({
        origin: 'tests',
        request: accountInfoRequestParams as any,
      })) as PublicAccountInfo;
      expect(accountInfo.metamaskAddress).toBe(ETH_ADDRESS);
      expect(accountInfo.accountID).toBeUndefined();

      expect.assertions(2);
    });

    it('should throw error when connecting to hedera account with ethereum chainId', async () => {
      const accountInfoRequestParams = getRequestParams('getAccountInfo', {
        externalAccount: {
          network: 'hedera',
          data: {
            accountId: HEDERA_ACCOUNT.accountId,
          },
        },
      });

      await expect(
        onRpcRequest({
          origin: 'tests',
          request: accountInfoRequestParams as any,
        }),
      ).rejects.toThrow();
      expect.assertions(1);
    });
  });

  describe('getAccountInfo hedera', () => {
    beforeAll(async () => {
      snapMock = buildMockSnap(HEDERA_CHAIN_ID.testnet, HEDERA_ACCOUNT.address);
      metamask = snapMock as unknown as MetaMaskInpageProvider;

      global.snap = snapMock;
      global.ethereum = metamask;
    });

    it('should set hedera external account info', async () => {
      snapMock.rpcMocks.snap_dialog.mockReturnValue(HEDERA_ACCOUNT.privateKey);

      const accountInfoRequestParams = getRequestParams('getAccountInfo', {
        externalAccount: {
          network: 'hedera',
          data: {
            accountId: HEDERA_ACCOUNT.accountId,
          },
        },
      });

      const accountInfo = (await onRpcRequest({
        origin: 'tests',
        request: accountInfoRequestParams as any,
      })) as PublicAccountInfo;
      expect(accountInfo.metamaskAddress).toBe(HEDERA_ACCOUNT.address);
      console.log(JSON.stringify(accountInfo));
      expect((accountInfo.accountID as HederaAccountParams).accountId).toBe(
        HEDERA_ACCOUNT.accountId,
      );
      expect.assertions(2);
    });
  });

  describe('getAccountInfo polygon', () => {
    beforeAll(async () => {
      snapMock = buildMockSnap(EVM_ACCOUNT.chainId, EVM_ACCOUNT.address);
      metamask = snapMock as unknown as MetaMaskInpageProvider;

      global.snap = snapMock;
      global.ethereum = metamask;
    });

    // eslint-disable-next-line
    it.skip('should set evm external account info', async () => {
      snapMock.rpcMocks.snap_dialog.mockReturnValue(EVM_ACCOUNT.privatekey);

      const externalEvmAccount = {
        externalAccount: {
          network: 'evm',
          data: {
            address: EVM_ACCOUNT.address,
          },
        },
      };

      const accountInfoRequestParams = getRequestParams(
        'getAccountInfo',
        externalEvmAccount,
      );

      const accountInfo = (await onRpcRequest({
        origin: 'tests',
        request: accountInfoRequestParams as any,
      })) as PublicAccountInfo;
      expect(accountInfo.metamaskAddress).toBe(EVM_ACCOUNT.address);
      console.log(JSON.stringify(accountInfo));
      expect(
        (accountInfo.externalAccountInfo as EvmAccountParams).address,
      ).toBe(EVM_ACCOUNT.address);
      expect.assertions(2);
    });
  });
});
