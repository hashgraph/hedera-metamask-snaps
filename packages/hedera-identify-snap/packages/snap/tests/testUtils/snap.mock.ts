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

/* eslint-disable */

import { BIP44CoinTypeNode } from '@metamask/key-tree';

import { AlchemyProvider, Provider, Wallet } from 'ethers';
import { IdentitySnapState } from '../../src/interfaces';
import { ETH_ADDRESS, mnemonic, privateKey } from './constants';
import { RequestArguments } from '@metamask/providers';
import { Maybe } from '@metamask/providers/dist/utils.cjs';

type ISnapMock = {
  request<T>(args: RequestArguments): Promise<Maybe<T>>;
  resetHistory(): void;
};
type SnapManageState = {
  operation: 'get' | 'update' | 'clear';
  newState: unknown;
};

export class SnapMock implements ISnapMock {
  private snapState: IdentitySnapState | null = null;

  private snap: Wallet = new Wallet(privateKey);

  private snapManageState(params: SnapManageState): IdentitySnapState | null {
    if (!params) {
      return null;
    }

    if (params.operation === 'get') {
      return this.snapState;
    }

    if (params.operation === 'update') {
      this.snapState = params.newState as IdentitySnapState;
    } else if (params.operation === 'clear') {
      this.snapState = null;
    }

    return null;
  }

  private async snapPersonalSign(data: string[]): Promise<string> {
    const signature = await this.snap.signMessage(data[0]);
    return signature;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async snapEthCall(data: any[]): Promise<string> {
    const apiKey = 'NRFBwig_CLVL0WnQLY3dUo8YkPmW-7iN';
    const provider = new AlchemyProvider('goerli', apiKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return provider.call(data[0]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async snapEthLogs(data: any[]): Promise<unknown> {
    const apiKey = 'NRFBwig_CLVL0WnQLY3dUo8YkPmW-7iN';
    const provider = new AlchemyProvider('goerli', apiKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return provider.getLogs(data[0]);
  }

  readonly rpcMocks = {
    snap_dialog: jest.fn(),
    eth_requestAccounts: jest.fn().mockResolvedValue([ETH_ADDRESS]),
    eth_chainId: jest.fn().mockResolvedValue('0x5'),
    net_version: jest.fn().mockResolvedValue('5'),
    snap_getBip44Entropy: jest
      .fn()
      .mockImplementation(async (params: { coinType: number }) => {
        const node = await BIP44CoinTypeNode.fromDerivationPath([
          `bip39:${mnemonic}`,
          `bip32:44'`,
          `bip32:${params.coinType}'`,
        ]);

        return node.toJSON();
      }),
    snap_manageState: jest
      .fn()
      .mockImplementation((params: unknown) =>
        this.snapManageState(params as SnapManageState),
      ),
    personal_sign: jest.fn().mockImplementation(async (data: unknown) => {
      return this.snapPersonalSign(data as string[]);
    }),
    eth_call: jest.fn().mockImplementation(async (data: unknown) => {
      return this.snapEthCall(data as any[]);
    }),
    eth_getLogs: jest.fn().mockImplementation(async (data: unknown) => {
      return this.snapEthLogs(data as any[]);
    }),
    eth_signTypedData_v4: jest
      .fn()
      .mockImplementation((...params: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const { domain, types, message } = JSON.parse(params[1] as any);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete types.EIP712Domain;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, no-underscore-dangle
        return this.snap.signTypedData(domain, types, message);
      }),
  };

  request<T>(args: RequestArguments): Promise<Maybe<T>> {
    const { method, params } = args;
    // @ts-expect-error Args params won't cause an issue
    // eslint-disable-next-line
    return this.rpcMocks[method](params);
  }

  resetHistory(): void {
    Object.values(this.rpcMocks).forEach((mock) => mock.mockRestore());
  }
}

/**
 * Creates and returns a Mock Snap
 *
 * @returns {SnapsGlobalObject & SnapMock} SnapMock
 */
export function createMockSnap(): SnapMock {
  return new SnapMock() as SnapMock;
}

/**
 * Creates and returns a Mock Snap
 *
 * @returns {SnapsGlobalObject & SnapMock} SnapMock
 */
export function buildMockSnap(chainId: string, address: string): SnapMock {
  let snapMock = new SnapMock() as SnapMock;
  snapMock.rpcMocks.eth_requestAccounts.mockResolvedValue([address]);
  snapMock.rpcMocks.eth_chainId.mockResolvedValue(chainId);
  return snapMock;
}
