import { RequestArguments } from '@metamask/providers/dist/BaseProvider';
import { Maybe } from '@metamask/providers/dist/utils';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { Wallet } from 'ethers';
import { IdentitySnapState } from '../../src/interfaces';
import { ETH_ADDRESS, privateKey, signedMsg } from './constants';

type IWalletMock = {
  request<T>(args: RequestArguments): Promise<Maybe<T>>;
  resetHistory(): void;
};

export class WalletMock implements IWalletMock {
  private snapState: IdentitySnapState | null = null;

  private wallet: Wallet = new Wallet(privateKey);

  private snapManageState(...params: unknown[]): IdentitySnapState | null {
    if (params.length === 0) {
      return null;
    }

    if (params[0] === 'get') {
      return this.snapState;
    } else if (params[0] === 'update') {
      this.snapState = params[1] as IdentitySnapState;
    } else if (params[0] === 'clear') {
      this.snapState = null;
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
        this.snapManageState(...params),
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
        return this.wallet._signTypedData(domain, types, message);
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
export function createMockWallet(): SnapsGlobalObject & WalletMock {
  return new WalletMock() as SnapsGlobalObject & WalletMock;
}
