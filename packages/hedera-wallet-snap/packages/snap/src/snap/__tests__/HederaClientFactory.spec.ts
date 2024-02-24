import { providerErrors } from '@metamask/rpc-errors';
import { getHederaClient } from '../../services/impl/hedera';
import { HederaClientFactory } from '../HederaClientFactory';

jest.mock('../../services/impl/hedera', () => ({
  getHederaClient: jest.fn(),
}));

jest.mock('@metamask/rpc-errors', () => ({
  providerErrors: {
    custom: jest.fn().mockImplementation(({ code, message, data }) => ({
      code,
      message,
      data,
    })),
  },
}));

describe('HederaClientFactory', () => {
  describe('create', () => {
    it('successfully creates a Hedera client', async () => {
      const mockClient = {}; // Mock the expected return value of a successful client creation
      (getHederaClient as jest.Mock).mockResolvedValue(mockClient);

      const client = await HederaClientFactory.create(
        'ECDSA_SECP256K1',
        'privateKey',
        'hederaAccountId',
        'network',
      );

      expect(client).toEqual(mockClient);
      expect(getHederaClient).toHaveBeenCalledWith(
        'ECDSA_SECP256K1',
        'privateKey',
        'hederaAccountId',
        'network',
      );
    });

    it('throws an error when unable to create a Hedera client', async () => {
      (getHederaClient as jest.Mock).mockResolvedValue(null); // null for a failure to create a client
      const action = HederaClientFactory.create(
        'ECDSA_SECP256K1',
        'privateKey',
        'hederaAccountId',
        'network',
      );

      await expect(action).rejects.toEqual({
        code: 4200,
        message: `Could not setup a Hedera client with hederaAccountId on network at this time. Please try again later.`,
        data: 'hederaAccountId',
      });
      expect(providerErrors.custom).toHaveBeenCalledWith({
        code: 4200,
        message: `Could not setup a Hedera client with hederaAccountId on network at this time. Please try again later.`,
        data: 'hederaAccountId',
      });
    });
  });
});
