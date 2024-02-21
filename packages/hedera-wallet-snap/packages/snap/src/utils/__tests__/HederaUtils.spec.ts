import { providerErrors } from '@metamask/rpc-errors';
import { HederaUtils } from '../HederaUtils';

describe('HederaUtils', () => {
  describe('getMirrorNodeFlagIfExists', () => {
    it('returns empty string if no mirrorNodeUrl provided', () => {
      const params = {}; // Empty params
      const result = HederaUtils.getMirrorNodeFlagIfExists(params);
      expect(result).toBe('');
    });

    it('returns normalized mirrorNodeUrl if provided', () => {
      const params = { mirrorNodeUrl: 'http://example.com/' };
      const result = HederaUtils.getMirrorNodeFlagIfExists(params);
      expect(result).toBe('http://example.com');
    });
  });

  describe('isExternalAccountFlagSet', () => {
    it('returns false if externalAccount flag is not set', () => {
      const params = {}; // Empty params
      const result = HederaUtils.isExternalAccountFlagSet(params);
      expect(result).toBe(false);
    });

    it('returns true if externalAccount flag is set correctly', () => {
      const params = {
        externalAccount: { accountIdOrEvmAddress: '0.0.123', curve: 'ED25519' },
      };
      const result = HederaUtils.isExternalAccountFlagSet(params);
      expect(result).toBe(true);
    });
  });

  describe('isValidServiceFee', () => {
    it('throws an error if serviceFee.percentageCut is invalid', () => {
      const params = { percentageCut: null, toAddress: '0.0.123' };
      expect(() => {
        HederaUtils.isValidServiceFee(params);
      }).toThrow(providerErrors.unsupportedMethod().message);
    });

    it('does not throw an error if serviceFee is valid', () => {
      const params = { percentageCut: 10, toAddress: '0.0.123' };
      expect(() => {
        HederaUtils.isValidServiceFee(params);
      }).not.toThrow();
    });
  });

  describe('isValidSignMessageRequest', () => {
    it('throws an error if message parameter is missing', () => {
      const params = {}; // Empty parameters
      expect(() => HederaUtils.isValidSignMessageRequest(params)).toThrow(
        providerErrors.unsupportedMethod().message,
      );
    });

    it('does not throw an error for valid message parameters', () => {
      const params = { message: 'Test message' };
      expect(() => HederaUtils.isValidSignMessageRequest(params)).not.toThrow();
    });
  });
  describe('isValidGetAccountInfoRequest', () => {
    it('throws an error if accountId is invalid', () => {
      const params = { accountId: 'invalid' };
      expect(() => HederaUtils.isValidGetAccountInfoRequest(params)).toThrow(
        providerErrors.unsupportedMethod().message,
      );
    });

    it('does not throw an error for valid accountId', () => {
      const params = { accountId: '0.0.12345' };
      expect(() =>
        HederaUtils.isValidGetAccountInfoRequest(params),
      ).not.toThrow();
    });
  });
  describe('isValidGetTransactionsParams', () => {
    it('throws an error if transactionId is invalid', () => {
      const params = { transactionId: '' }; // Invalid empty string
      expect(() => HederaUtils.isValidGetTransactionsParams(params)).toThrow(
        providerErrors.unsupportedMethod().message,
      );
    });

    it('does not throw an error for valid transactionId', () => {
      const params = { transactionId: '0.0.12345@123456789' };
      expect(() =>
        HederaUtils.isValidGetTransactionsParams(params),
      ).not.toThrow();
    });
  });
  describe('isValidAssociateTokensParams', () => {
    it('throws an error if tokenIds array is empty', () => {
      const params = { tokenIds: [] };
      expect(() => HederaUtils.isValidAssociateTokensParams(params)).toThrow(
        providerErrors.unsupportedMethod().message,
      );
    });

    it('does not throw an error for valid tokenIds', () => {
      const params = { tokenIds: ['0.0.123', '0.0.456'] };
      expect(() =>
        HederaUtils.isValidAssociateTokensParams(params),
      ).not.toThrow();
    });
  });
  describe('isValidTransferCryptoParams', () => {
    it('throws an error if transfers parameter is missing or empty', () => {
      const emptyParams = {};
      expect(() =>
        HederaUtils.isValidTransferCryptoParams(emptyParams),
      ).toThrow(
        'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
      );

      const paramsWithEmptyArray = { transfers: [] };
      expect(() =>
        HederaUtils.isValidTransferCryptoParams(paramsWithEmptyArray),
      ).toThrow(
        'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
      );
    });

    it('does not throw an error for valid transfers parameters', () => {
      const validParams = {
        transfers: [{ to: '0.0.123', amount: 100, assetType: 'HBAR' }],
      };
      expect(() =>
        HederaUtils.isValidTransferCryptoParams(validParams),
      ).not.toThrow();
    });
  });
  describe('isValidStakeHbarParams', () => {
    it('throws an error if neither nodeId nor accountId are provided', () => {
      const invalidParams = {};
      expect(() => HederaUtils.isValidStakeHbarParams(invalidParams)).toThrow(
        'Invalid stakeHbar Params passed. Pass either "nodeId" or "accountId" as a parameter',
      );
    });

    it('does not throw an error when valid nodeId is provided', () => {
      const paramsWithNodeId = { nodeId: 0 };
      expect(() =>
        HederaUtils.isValidStakeHbarParams(paramsWithNodeId),
      ).not.toThrow();
    });

    it('does not throw an error when valid accountId is provided', () => {
      const paramsWithAccountId = { accountId: '0.0.12345' };
      expect(() =>
        HederaUtils.isValidStakeHbarParams(paramsWithAccountId),
      ).not.toThrow();
    });

    // Test for invalid nodeId and accountId formats
  });
  describe('isValidDeleteAccountParams', () => {
    it('throws an error if transferAccountId is missing or invalid', () => {
      const invalidParams = {};
      expect(() =>
        HederaUtils.isValidDeleteAccountParams(invalidParams),
      ).toThrow(
        'Invalid deleteAccount Params passed. "transferAccountId" must be passed as a parameter',
      );

      const invalidParams2 = { transferAccountId: '' };
      expect(() =>
        HederaUtils.isValidDeleteAccountParams(invalidParams2),
      ).toThrow(
        'Invalid deleteAccount Params passed. "transferAccountId" is not a valid Account ID',
      );
    });

    it('does not throw an error for valid transferAccountId', () => {
      const validParams = { transferAccountId: '0.0.12345' };
      expect(() =>
        HederaUtils.isValidDeleteAccountParams(validParams),
      ).not.toThrow();
    });
  });
});
