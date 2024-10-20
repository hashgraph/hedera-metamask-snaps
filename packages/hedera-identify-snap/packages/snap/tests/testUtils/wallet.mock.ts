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
import { Wallet } from 'ethers';
import { IdentitySnapState } from '../../src/interfaces';
import { ETH_ADDRESS, privateKey, signedMsg } from './constants';
import { RequestArguments } from '@metamask/providers';
import { Maybe } from '@metamask/providers/dist/utils.cjs';

type IWalletMock = {
  request<T>(args: RequestArguments): Promise<Maybe<T>>;
  resetHistory(): void;
};

export class WalletMock implements IWalletMock {
  #snapState: IdentitySnapState | null = null;

  readonly #wallet: Wallet = new Wallet(privateKey);

  #snapManageState(...params: unknown[]): IdentitySnapState | null {
    if (params.length === 0) {
      return null;
    }

    if (params[0] === 'get') {
      return this.#snapState;
    } else if (params[0] === 'update') {
      this.#snapState = params[1] as IdentitySnapState;
    } else if (params[0] === 'clear') {
      this.#snapState = null;
    }

    return null;
  }

  readonly rpcMocks = {
    snap_confirm: jest.fn(),
    eth_requestAccounts: jest.fn().mockResolvedValue([ETH_ADDRESS]),
    eth_chainId: jest.fn().mockResolvedValue('4'),
    snap_manageState: jest
      .fn()
      .mockImplementation((...params: unknown[]) =>
        this.#snapManageState(...params),
      ),
    personal_sign: jest.fn().mockResolvedValue(signedMsg),
    eth_signTypedData_v4: jest
      .fn()
      .mockImplementation((...params: unknown[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const { domain, types, message } = JSON.parse(params[1] as any);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete types.EIP712Domain;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this.#wallet.signTypedData(domain, types, message);
      }),
  };

  request<T>(args: RequestArguments): Promise<Maybe<T>> {
    const { method, params = [] } = args;

    // @ts-expect-error Args params won't cause an issue
    // eslint-disable-next-line
    return this.rpcMocks[method](...params);
  }

  resetHistory(): void {
    Object.values(this.rpcMocks).forEach((mock) => mock.mockRestore());
  }
}

/**
 * Create mock wallet.
 *
 * @returns Wallet mock.
 */
export function createMockWallet(): WalletMock {
  return new WalletMock() as WalletMock;
}
