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

import { HederaUtils } from '../HederaUtils';
import { hederaNetworks } from '../../types/constants';

describe('HederaUtils.checkValidString', () => {
  it('should throw an error if the required string property is missing', () => {
    const params = { someOtherProp: 'hello' };
    expect(() =>
      HederaUtils.checkValidString(params, 'testMethod', 'missingProp', true),
    ).toThrow();
  });

  it('should throw an error if the property is not a string', () => {
    const params = { testProp: 123 };
    expect(() =>
      HederaUtils.checkValidString(params, 'testMethod', 'testProp', true),
    ).toThrow();
  });

  it('should pass if the property is a valid string', () => {
    const params = { testProp: 'valid string' };
    expect(() =>
      HederaUtils.checkValidString(params, 'testMethod', 'testProp', true),
    ).not.toThrow();
  });
});

describe('HederaUtils.checkValidAccountId', () => {
  it('should throw an error if the property is not a valid Hedera AccountId', () => {
    const params = { accountId: 'invalid-id' };
    expect(() =>
      HederaUtils.checkValidAccountId(params, 'testMethod', 'accountId', true),
    ).toThrow();
  });

  it('should pass if the property is a valid Hedera AccountId', () => {
    const params = { accountId: '0.0.1234' };
    expect(() =>
      HederaUtils.checkValidAccountId(params, 'testMethod', 'accountId', true),
    ).not.toThrow();
  });
});

describe('HederaUtils.checkValidBoolean', () => {
  it('should throw an error if the property is not a boolean', () => {
    const params = { testProp: 'not a boolean' };
    expect(() =>
      HederaUtils.checkValidBoolean(params, 'testMethod', 'testProp', true),
    ).toThrow();
  });

  it('should pass if the property is a valid boolean', () => {
    const params = { testProp: true };
    expect(() =>
      HederaUtils.checkValidBoolean(params, 'testMethod', 'testProp', true),
    ).not.toThrow();
  });
});

describe('HederaUtils.validHederaNetwork', () => {
  it('should return true for a valid network name', () => {
    const validNetwork = 'mainnet';
    const result = HederaUtils.validHederaNetwork(validNetwork);
    expect(result).toBe(true);
  });

  it('should return false for an invalid network name', () => {
    const invalidNetwork = 'unknownnet';
    const result = HederaUtils.validHederaNetwork(invalidNetwork);
    expect(result).toBe(false);
  });

  it('should return true for each predefined valid network', () => {
    hederaNetworks.forEach((network) => {
      expect(HederaUtils.validHederaNetwork(network)).toBe(true);
    });
  });

  it('should handle empty or undefined input gracefully', () => {
    expect(HederaUtils.validHederaNetwork('')).toBe(false);
  });
});

describe('HederaUtils.isValidSignScheduledTxParams', () => {
  it('should validate successfully with a valid scheduleId', () => {
    const params = { scheduleId: '0.0.12345' };
    expect(() =>
      HederaUtils.isValidSignScheduledTxParams(params),
    ).not.toThrow();
  });

  it('should throw an error if the scheduleId is missing', () => {
    const params = {}; // Missing scheduleId
    expect(() => HederaUtils.isValidSignScheduledTxParams(params)).toThrow();
  });

  it('should throw an error if the scheduleId is not a string', () => {
    const params = { scheduleId: 12345 }; // Invalid type for scheduleId
    expect(() => HederaUtils.isValidSignScheduledTxParams(params)).toThrow();
  });

  it('should throw an error if the scheduleId is an empty string', () => {
    const params = { scheduleId: '' }; // Empty string for scheduleId
    expect(() => HederaUtils.isValidSignScheduledTxParams(params)).toThrow();
  });

  it('should throw an error if null is passed as parameters', () => {
    expect(() => HederaUtils.isValidSignScheduledTxParams(null)).toThrow();
  });

  it('should throw an error if the parameters are undefined', () => {
    expect(() => HederaUtils.isValidSignScheduledTxParams(undefined)).toThrow();
  });
});

describe('HederaUtils.isValidWipeTokenParams', () => {
  it('validates successfully for a valid TOKEN with amount', () => {
    const params = {
      assetType: 'TOKEN',
      tokenId: '0.0.123',
      accountId: '0.0.456',
      amount: 100,
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).not.toThrow();
  });

  it('validates successfully for a valid NFT with serial numbers', () => {
    const params = {
      assetType: 'NFT',
      tokenId: '0.0.789',
      accountId: '0.0.456',
      serialNumbers: [1, 2, 3],
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).not.toThrow();
  });

  it('throws an error if assetType is neither TOKEN nor NFT', () => {
    const params = {
      assetType: 'INVALID_TYPE',
      tokenId: '0.0.123',
      accountId: '0.0.456',
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });

  it('throws an error if tokenId is missing', () => {
    const params = {
      assetType: 'TOKEN',
      accountId: '0.0.456',
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });

  it('throws an error if accountId is missing', () => {
    const params = {
      assetType: 'TOKEN',
      tokenId: '0.0.123',
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });

  it('throws an error if amount is passed with NFT', () => {
    const params = {
      assetType: 'NFT',
      tokenId: '0.0.789',
      accountId: '0.0.456',
      amount: 100,
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });

  it('throws an error if serialNumbers are missing for an NFT', () => {
    const params = {
      assetType: 'NFT',
      tokenId: '0.0.789',
      accountId: '0.0.456',
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });

  it('throws an error if serialNumbers are passed with TOKEN', () => {
    const params = {
      assetType: 'TOKEN',
      tokenId: '0.0.789',
      accountId: '0.0.456',
      serialNumbers: [1, 2, 3],
    };
    expect(() => HederaUtils.isValidWipeTokenParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidFreezeOrEnableKYCAccountParams', () => {
  it('validates successfully with valid tokenId and accountId', () => {
    const params = {
      tokenId: '0.0.123',
      accountId: '0.0.456',
    };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).not.toThrow();
  });

  it('throws an error if tokenId is missing', () => {
    const params = { accountId: '0.0.456' };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).toThrow();
  });

  it('throws an error if accountId is missing', () => {
    const params = { tokenId: '0.0.123' };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).toThrow();
  });

  it('throws an error if tokenId is not a valid string', () => {
    const params = {
      tokenId: 123, // Invalid type
      accountId: '0.0.456',
    };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).toThrow();
  });

  it('throws an error if accountId is not a valid string', () => {
    const params = {
      tokenId: '0.0.123',
      accountId: 456, // Invalid type
    };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).toThrow();
  });

  it('handles empty strings for tokenId and accountId', () => {
    const params = {
      tokenId: '',
      accountId: '',
    };
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(params),
    ).toThrow();
  });

  it('handles null and undefined inputs gracefully', () => {
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(null),
    ).toThrow();
    expect(() =>
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(undefined),
    ).toThrow();
  });
});

describe('HederaUtils.isValidPauseOrDeleteTokenParams', () => {
  it('validates successfully with a valid tokenId', () => {
    const params = {
      tokenId: '0.0.123',
    };
    expect(() =>
      HederaUtils.isValidPauseOrDeleteTokenParams(params),
    ).not.toThrow();
  });

  it('throws an error if tokenId is missing', () => {
    const params = {}; // Missing tokenId
    expect(() => HederaUtils.isValidPauseOrDeleteTokenParams(params)).toThrow();
  });

  it('throws an error if tokenId is not a valid string', () => {
    const params = { tokenId: 12345 }; // Invalid type for tokenId
    expect(() => HederaUtils.isValidPauseOrDeleteTokenParams(params)).toThrow();
  });

  it('throws an error if tokenId is an empty string', () => {
    const params = { tokenId: '' }; // Empty string for tokenId
    expect(() => HederaUtils.isValidPauseOrDeleteTokenParams(params)).toThrow();
  });

  it('handles null and undefined inputs gracefully', () => {
    expect(() => HederaUtils.isValidPauseOrDeleteTokenParams(null)).toThrow(
      'Invalid Params passed. "tokenId" must be passed as a parameter',
    );
    expect(() =>
      HederaUtils.isValidPauseOrDeleteTokenParams(undefined),
    ).toThrow();
  });
});

describe('HederaUtils.isValidDissociateTokensParams', () => {
  it('validates successfully with a valid array of tokenIds', () => {
    const params = {
      tokenIds: ['0.0.123', '0.0.456'],
    };
    expect(() =>
      HederaUtils.isValidDissociateTokensParams(params),
    ).not.toThrow();
  });

  it('throws an error if tokenIds is missing', () => {
    const params = {}; // Missing tokenIds
    expect(() => HederaUtils.isValidDissociateTokensParams(params)).toThrow();
  });

  it('throws an error if tokenIds is not an array', () => {
    const params = { tokenIds: '0.0.123' }; // Incorrect type
    expect(() => HederaUtils.isValidDissociateTokensParams(params)).toThrow();
  });

  it('throws an error if tokenIds array is empty', () => {
    const params = { tokenIds: [] }; // Empty array for tokenIds
    expect(() => HederaUtils.isValidDissociateTokensParams(params)).toThrow();
  });

  it('throws an error if any element in tokenIds array is not a string', () => {
    const params = { tokenIds: ['0.0.123', 456] }; // One element is not a string
    expect(() => HederaUtils.isValidDissociateTokensParams(params)).toThrow();
  });

  it('handles null and undefined inputs gracefully', () => {
    expect(() => HederaUtils.isValidDissociateTokensParams(null)).toThrow();
    expect(() =>
      HederaUtils.isValidDissociateTokensParams(undefined),
    ).toThrow();
  });
});

describe('HederaUtils.isValidAssociateTokensParams', () => {
  it('validates successfully with a valid array of tokenIds', () => {
    const params = {
      tokenIds: ['0.0.123', '0.0.456'],
    };
    expect(() =>
      HederaUtils.isValidAssociateTokensParams(params),
    ).not.toThrow();
  });

  it('throws an error if tokenIds is missing', () => {
    const params = {}; // Missing tokenIds
    expect(() => HederaUtils.isValidAssociateTokensParams(params)).toThrow();
  });

  it('throws an error if tokenIds is not an array', () => {
    const params = { tokenIds: '0.0.123' }; // Incorrect type for tokenIds
    expect(() => HederaUtils.isValidAssociateTokensParams(params)).toThrow();
  });

  it('throws an error if tokenIds array is empty', () => {
    const params = { tokenIds: [] }; // Empty array for tokenIds
    expect(() => HederaUtils.isValidAssociateTokensParams(params)).toThrow();
  });

  it('throws an error if any element in tokenIds array is not a string', () => {
    const params = { tokenIds: ['0.0.123', 456] }; // One element is not a string
    expect(() => HederaUtils.isValidAssociateTokensParams(params)).toThrow();
  });

  it('handles null and undefined inputs gracefully', () => {
    expect(() => HederaUtils.isValidAssociateTokensParams(null)).toThrow();
    expect(() => HederaUtils.isValidAssociateTokensParams(undefined)).toThrow();
  });
});

describe('HederaUtils.isValidBurnTokenParams', () => {
  let validTokenParams: any;
  let validNFTParams: any;

  beforeEach(() => {
    validTokenParams = {
      assetType: 'TOKEN',
      tokenId: '0.0.1234',
      amount: 100,
    };
    validNFTParams = {
      assetType: 'NFT',
      tokenId: '0.0.5678',
      serialNumbers: [1, 2, 3],
    };
  });

  it('should validate fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidBurnTokenParams(validTokenParams),
    ).not.toThrow();
  });

  it('should validate non-fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidBurnTokenParams(validNFTParams),
    ).not.toThrow();
  });

  it('should throw if required parameters are missing', () => {
    const invalidParams = { ...validTokenParams };
    delete invalidParams.tokenId;
    expect(() => HederaUtils.isValidBurnTokenParams(invalidParams)).toThrow();
  });

  it('should throw if "amount" is included with NFT assetType', () => {
    const params = { ...validNFTParams, amount: 1 };
    expect(() => HederaUtils.isValidBurnTokenParams(params)).toThrow();
  });

  it('should throw if "serialNumbers" are missing for NFT', () => {
    const params = { ...validNFTParams };
    delete params.serialNumbers;
    expect(() => HederaUtils.isValidBurnTokenParams(params)).toThrow();
  });

  it('should throw if "amount" is zero or less for TOKEN', () => {
    const params = { ...validTokenParams, amount: 0 };
    expect(() => HederaUtils.isValidBurnTokenParams(params)).toThrow();
  });

  it('should throw if "serialNumbers" are not provided correctly for NFTs', () => {
    const params = { ...validNFTParams, serialNumbers: [-1, 0] };
    expect(() => HederaUtils.isValidBurnTokenParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidMintTokenParams', () => {
  let validTokenParams: any;
  let validNFTParams: any;

  beforeEach(() => {
    validTokenParams = {
      assetType: 'TOKEN',
      tokenId: '0.0.1234',
      amount: 100,
    };
    validNFTParams = {
      assetType: 'NFT',
      tokenId: '0.0.5678',
      metadata: ['base64:example'],
    };
  });

  it('should validate fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidMintTokenParams(validTokenParams),
    ).not.toThrow();
  });

  it('should validate non-fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidMintTokenParams(validNFTParams),
    ).not.toThrow();
  });

  it('should throw if required parameters are missing for tokens', () => {
    const invalidParams = { ...validTokenParams };
    delete invalidParams.tokenId;
    expect(() => HederaUtils.isValidMintTokenParams(invalidParams)).toThrow();
  });

  it('should throw if "amount" is provided for NFT', () => {
    const params = { ...validNFTParams, amount: 1 };
    expect(() => HederaUtils.isValidMintTokenParams(params)).toThrow();
  });

  it('should throw if metadata is missing for NFTs', () => {
    const params = { ...validNFTParams };
    delete params.metadata;
    expect(() => HederaUtils.isValidMintTokenParams(params)).toThrow();
  });

  it('should throw if "amount" is zero or negative for TOKEN', () => {
    const params = { ...validTokenParams, amount: 0 };
    expect(() => HederaUtils.isValidMintTokenParams(params)).toThrow();
  });

  it('should throw if invalid metadata array for NFTs', () => {
    const params = { ...validNFTParams, metadata: [] };
    expect(() => HederaUtils.isValidMintTokenParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidUpdateTokenParams', () => {
  let validParams: any;
  const dummyPublicKey =
    '02f9291bec57224d13c8367b4cb47b197fc403515dd4721a15d937e6f89f267d47';

  beforeEach(() => {
    validParams = {
      tokenId: '0.0.1234',
      name: 'Updated Token Name',
      symbol: 'UTN',
      treasuryAccountId: '0.0.1235',
      adminPublicKey: dummyPublicKey,
      kycPublicKey: dummyPublicKey,
      freezePublicKey: dummyPublicKey,
      feeSchedulePublicKey: dummyPublicKey,
      pausePublicKey: dummyPublicKey,
      wipePublicKey: dummyPublicKey,
      supplyPublicKey: dummyPublicKey,
      expirationTime: '2025-12-31T12:00:00',
      tokenMemo: 'New memo for the token',
      autoRenewAccountId: '0.0.1236',
      autoRenewPeriod: 7890000,
    };
  });

  it('should validate when all valid parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidUpdateTokenParams(validParams),
    ).not.toThrow();
  });

  it('should throw if tokenId is missing', () => {
    const params = { ...validParams };
    delete params.tokenId;
    expect(() => HederaUtils.isValidUpdateTokenParams(params)).toThrow();
  });

  it('should throw if no update parameters are provided', () => {
    const params = { tokenId: validParams.tokenId };
    expect(() => HederaUtils.isValidUpdateTokenParams(params)).toThrow();
  });

  it('should throw if provided symbol is too long', () => {
    const params = { ...validParams, symbol: 'T'.repeat(101) }; // Assuming 100 is the max length
    expect(() => HederaUtils.isValidUpdateTokenParams(params)).toThrow();
  });

  it('should validate correct autoRenewPeriod', () => {
    const params = { ...validParams, autoRenewPeriod: 'invalidNumber' };
    expect(() => HederaUtils.isValidUpdateTokenParams(params)).toThrow();
  });

  it('should validate presence of at least one optional parameter', () => {
    const minimalValidParams = {
      tokenId: '0.0.1234',
      name: 'Valid Token Name',
    };
    expect(() =>
      HederaUtils.isValidUpdateTokenParams(minimalValidParams),
    ).not.toThrow();
  });
});

describe('HederaUtils.isValidUpdateTokenFeeScheduleParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      tokenId: '0.0.1234',
      customFees: [
        {
          feeCollectorAccountId: '0.0.1235',
          hbarAmount: 10,
          tokenAmount: 50,
          denominatingTokenId: '0.0.9876',
          allCollectorsAreExempt: false,
        },
      ],
    };
  });

  it('should validate when all valid parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidUpdateTokenFeeScheduleParams(validParams),
    ).not.toThrow();
  });

  it('should throw if tokenId is missing', () => {
    const params = { ...validParams };
    delete params.tokenId;
    expect(() =>
      HederaUtils.isValidUpdateTokenFeeScheduleParams(params),
    ).toThrow();
  });

  it('should throw if customFees contains incorrect data types', () => {
    const params = {
      ...validParams,
      customFees: [
        {
          feeCollectorAccountId: '0.0.1235',
          hbarAmount: 'incorrect data type',
          tokenAmount: 'another incorrect data type',
          denominatingTokenId: '0.0.9876',
          allCollectorsAreExempt: 'not a boolean',
        },
      ],
    };
    expect(() =>
      HederaUtils.isValidUpdateTokenFeeScheduleParams(params),
    ).toThrow();
  });

  it('should validate hbarAmount and tokenAmount as numbers', () => {
    const params = {
      ...validParams,
      customFees: [
        {
          feeCollectorAccountId: '0.0.1235',
          hbarAmount: 10,
          tokenAmount: 50,
          denominatingTokenId: '0.0.9876',
          allCollectorsAreExempt: false,
        },
      ],
    };
    expect(() =>
      HederaUtils.isValidUpdateTokenFeeScheduleParams(params),
    ).not.toThrow();
  });

  it('should check for validity of allCollectorsAreExempt as a boolean', () => {
    const params = {
      ...validParams,
      customFees: [
        {
          feeCollectorAccountId: '0.0.1235',
          hbarAmount: 10,
          tokenAmount: 50,
          denominatingTokenId: '0.0.9876',
          allCollectorsAreExempt: true,
        },
      ],
    };
    expect(() =>
      HederaUtils.isValidUpdateTokenFeeScheduleParams(params),
    ).not.toThrow();
  });
});

describe('HederaUtils.isValidCreateTokenParams', () => {
  let validTokenParams: any;
  let validNFTParams: any;
  const dummyPublicKey =
    '02f9291bec57224d13c8367b4cb47b197fc403515dd4721a15d937e6f89f267d47';

  beforeEach(() => {
    validTokenParams = {
      assetType: 'TOKEN',
      name: 'New Fungible Token',
      symbol: 'NFT',
      decimals: 2,
      initialSupply: 1000,
      supplyType: 'FINITE',
      maxSupply: 5000,
      treasuryAccountId: '0.0.1234',
      adminPublicKey: dummyPublicKey,
      kycPublicKey: dummyPublicKey,
      freezePublicKey: dummyPublicKey,
      wipePublicKey: dummyPublicKey,
      supplyPublicKey: dummyPublicKey,
      freezeDefault: false,
    };
    validNFTParams = {
      assetType: 'NFT',
      name: 'New Non-Fungible Token',
      symbol: 'NFT',
      decimals: 0,
      initialSupply: 0,
      supplyType: 'FINITE',
      maxSupply: 100,
      treasuryAccountId: '0.0.1234',
      adminPublicKey: dummyPublicKey,
      kycPublicKey: dummyPublicKey,
      freezePublicKey: dummyPublicKey,
      wipePublicKey: dummyPublicKey,
      supplyPublicKey: dummyPublicKey,
      freezeDefault: false,
    };
  });

  it('should validate fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidCreateTokenParams(validTokenParams),
    ).not.toThrow();
  });

  it('should validate non-fungible token parameters correctly', () => {
    expect(() =>
      HederaUtils.isValidCreateTokenParams(validNFTParams),
    ).not.toThrow();
  });

  it('should throw if required parameters are missing', () => {
    const invalidParams = { ...validTokenParams };
    delete invalidParams.name;
    expect(() => HederaUtils.isValidCreateTokenParams(invalidParams)).toThrow();
  });

  it('should throw if "decimals" is not zero for NFT', () => {
    const params = { ...validNFTParams, decimals: 1 };
    expect(() => HederaUtils.isValidCreateTokenParams(params)).toThrow();
  });

  it('should throw if "initialSupply" is not zero for NFT', () => {
    const params = { ...validNFTParams, initialSupply: 1 };
    expect(() => HederaUtils.isValidCreateTokenParams(params)).toThrow();
  });

  it('should throw if "maxSupply" is undefined when supplyType is FINITE', () => {
    const params = { ...validTokenParams, maxSupply: undefined };
    expect(() => HederaUtils.isValidCreateTokenParams(params)).toThrow();
  });

  it('should throw if "supplyType" is not one of the predefined values', () => {
    const params = { ...validTokenParams, supplyType: 'UNDEFINED' };
    expect(() => HederaUtils.isValidCreateTokenParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidDeleteAllowanceParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      assetType: 'TOKEN',
      spenderAccountId: '0.0.1234',
      assetId: '0.0.5678',
    };
  });

  it('should validate when all valid parameters are provided for TOKEN', () => {
    expect(() =>
      HederaUtils.isValidDeleteAllowanceParams(validParams),
    ).not.toThrow();
  });

  it('should validate for HBAR without assetId', () => {
    const hbarParams = {
      assetType: 'HBAR',
      spenderAccountId: '0.0.1234',
    };
    expect(() =>
      HederaUtils.isValidDeleteAllowanceParams(hbarParams),
    ).not.toThrow();
  });

  it('should throw if assetType is missing', () => {
    const params = { ...validParams };
    delete params.assetType;
    expect(() => HederaUtils.isValidDeleteAllowanceParams(params)).toThrow();
  });

  it('should throw if spenderAccountId is missing', () => {
    const params = { ...validParams };
    delete params.spenderAccountId;
    expect(() => HederaUtils.isValidDeleteAllowanceParams(params)).toThrow();
  });

  it('should throw if assetType is not HBAR, TOKEN, or NFT', () => {
    const params = { ...validParams, assetType: 'INVALID' };
    expect(() => HederaUtils.isValidDeleteAllowanceParams(params)).toThrow();
  });

  it('should throw if assetId is provided for HBAR', () => {
    const hbarParams = {
      assetType: 'HBAR',
      spenderAccountId: '0.0.1234',
      assetId: '0.0.5678',
    };
    expect(() =>
      HederaUtils.isValidDeleteAllowanceParams(hbarParams),
    ).toThrow();
  });

  it('should throw if assetId is missing for TOKEN', () => {
    const params = { ...validParams, assetId: undefined };
    expect(() => HederaUtils.isValidDeleteAllowanceParams(params)).toThrow();
  });

  it('should validate with all parameters correct for NFT', () => {
    const nftParams = {
      assetType: 'NFT',
      spenderAccountId: '0.0.1234',
      assetId: '0.0.5678',
    };
    expect(() =>
      HederaUtils.isValidDeleteAllowanceParams(nftParams),
    ).not.toThrow();
  });
});

describe('HederaUtils.isValidApproveAllowanceParams', () => {
  let validTokenParams: any;
  let validNFTParams: any;

  beforeEach(() => {
    validTokenParams = {
      assetType: 'TOKEN',
      spenderAccountId: '0.0.1234',
      amount: 100,
      assetId: '0.0.5678',
      assetDetail: {
        assetId: '0.0.5678',
        assetDecimals: '2',
      },
    };
    validNFTParams = {
      assetType: 'NFT',
      spenderAccountId: '0.0.1234',
      amount: 1,
      assetId: '0.0.5678',
      assetDetail: {
        assetId: '0.0.5678',
        assetDecimals: '2',
      },
    };
  });

  it('should validate when all valid TOKEN parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidApproveAllowanceParams(validTokenParams),
    ).not.toThrow();
  });

  it('should validate when all valid NFT parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidApproveAllowanceParams(validNFTParams),
    ).not.toThrow();
  });

  it('should throw if assetType is missing', () => {
    const params = { ...validTokenParams };
    delete params.assetType;
    expect(() => HederaUtils.isValidApproveAllowanceParams(params)).toThrow();
  });

  it('should throw if spenderAccountId is missing', () => {
    const params = { ...validTokenParams };
    delete params.spenderAccountId;
    expect(() => HederaUtils.isValidApproveAllowanceParams(params)).toThrow();
  });

  it('should throw if amount is not provided', () => {
    const params = { ...validTokenParams, amount: undefined };
    expect(() => HederaUtils.isValidApproveAllowanceParams(params)).toThrow();
  });

  it('should throw if assetType is not one of the valid types', () => {
    const params = { ...validTokenParams, assetType: 'INVALID' };
    expect(() => HederaUtils.isValidApproveAllowanceParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidDeleteAccountParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      transferAccountId: '0.0.1234',
    };
  });

  it('should validate when a valid transferAccountId is provided', () => {
    expect(() =>
      HederaUtils.isValidDeleteAccountParams(validParams),
    ).not.toThrow();
  });

  it('should throw if transferAccountId is missing', () => {
    const params = { ...validParams };
    delete params.transferAccountId;
    expect(() => HederaUtils.isValidDeleteAccountParams(params)).toThrow();
  });

  it('should throw if transferAccountId format is invalid', () => {
    const params = { ...validParams, transferAccountId: 'invalid_account_id' };
    expect(() => HederaUtils.isValidDeleteAccountParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidStakeHbarParams', () => {
  let validNodeIdParams: any;
  let validAccountIdParams: any;

  beforeEach(() => {
    validNodeIdParams = {
      nodeId: 0,
    };
    validAccountIdParams = {
      accountId: '0.0.1234',
    };
  });

  it('should validate when a valid nodeId is provided', () => {
    expect(() =>
      HederaUtils.isValidStakeHbarParams(validNodeIdParams),
    ).not.toThrow();
  });

  it('should validate when a valid accountId is provided', () => {
    expect(() =>
      HederaUtils.isValidStakeHbarParams(validAccountIdParams),
    ).not.toThrow();
  });

  it('should throw if both nodeId and accountId are missing', () => {
    expect(() => HederaUtils.isValidStakeHbarParams({})).toThrow();
  });

  it('should throw if nodeId is not a number', () => {
    const params = { nodeId: 'not_a_number' };
    expect(() => HederaUtils.isValidStakeHbarParams(params)).toThrow();
  });

  it('should throw if accountId format is invalid', () => {
    const params = { accountId: 'invalid_account_id' };
    expect(() => HederaUtils.isValidStakeHbarParams(params)).toThrow();
  });
});

describe('HederaUtils.checkAtomicSwapTransfers', () => {
  let validHBARTransfer: any;
  let validTokenTransfer: any;
  let validNFTTransfer: any;

  beforeEach(() => {
    validHBARTransfer = {
      assetType: 'HBAR',
      to: '0.0.1234',
      amount: 100,
    };
    validTokenTransfer = {
      assetType: 'TOKEN',
      to: '0.0.1235',
      amount: 150,
      assetId: '0.0.5678',
      decimals: 2,
    };
    validNFTTransfer = {
      assetType: 'NFT',
      to: '0.0.1236',
      amount: 1,
      assetId: '0.0.5679/1',
    };
  });

  it('should validate HBAR transfer correctly', () => {
    expect(() =>
      HederaUtils.checkAtomicSwapTransfers(validHBARTransfer, true),
    ).not.toThrow();
  });

  it('should validate TOKEN transfer correctly', () => {
    expect(() =>
      HederaUtils.checkAtomicSwapTransfers(validTokenTransfer, true),
    ).not.toThrow();
  });

  it('should validate NFT transfer correctly', () => {
    expect(() =>
      HederaUtils.checkAtomicSwapTransfers(validNFTTransfer, true),
    ).not.toThrow();
  });

  it('should throw if assetType is missing', () => {
    const params = { ...validHBARTransfer };
    delete params.assetType;
    expect(() => HederaUtils.checkAtomicSwapTransfers(params, true)).toThrow();
  });

  it('should throw if "to" address is missing', () => {
    const params = { ...validHBARTransfer, to: undefined };
    expect(() => HederaUtils.checkAtomicSwapTransfers(params, true)).toThrow();
  });

  it('should throw if "amount" is not a number', () => {
    const params = { ...validHBARTransfer, amount: 'not a number' };
    expect(() => HederaUtils.checkAtomicSwapTransfers(params, true)).toThrow();
  });

  it('should throw if "assetId" is missing for TOKEN and NFT', () => {
    const params = { ...validTokenTransfer, assetId: undefined };
    expect(() => HederaUtils.checkAtomicSwapTransfers(params, true)).toThrow();
  });

  it('should throw if "amount" is not 1 for NFT', () => {
    const params = { ...validNFTTransfer, amount: 2 };
    expect(() => HederaUtils.checkAtomicSwapTransfers(params, true)).toThrow();
  });
});

describe('HederaUtils.isValidInitiateSwapParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      memo: 'Test swap',
      maxFee: 100,
      atomicSwaps: [
        {
          requester: {
            assetType: 'TOKEN',
            amount: 100,
            assetId: '0.0.1234',
            from: '0.0.5001',
            to: '0.0.5002',
          },
          responder: {
            assetType: 'TOKEN',
            amount: 150,
            assetId: '0.0.1235',
            from: '0.0.5002',
          },
        },
      ],
      serviceFee: {
        percentageCut: 5,
        toAddress: '0.0.6000',
      },
    };
  });

  it('should validate when all valid parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidInitiateSwapParams(validParams),
    ).not.toThrow();
  });

  it('should throw if memo is missing', () => {
    const params = { ...validParams, memo: undefined };
    expect(() => HederaUtils.isValidInitiateSwapParams(params)).toThrow();
  });

  it('should throw if maxFee is not a number', () => {
    const params = { ...validParams, maxFee: 'not a number' };
    expect(() => HederaUtils.isValidInitiateSwapParams(params)).toThrow();
  });

  it('should throw if atomicSwaps is empty or not an array', () => {
    const params = { ...validParams, atomicSwaps: [] };
    expect(() => HederaUtils.isValidInitiateSwapParams(params)).toThrow();
  });

  it('should throw if atomic swap elements are incomplete', () => {
    const incompleteParams = {
      ...validParams,
      atomicSwaps: [
        {
          requester: {
            assetType: 'TOKEN',
            amount: 100,
            assetId: '0.0.1234',
          },
        },
      ],
    };
    expect(() =>
      HederaUtils.isValidInitiateSwapParams(incompleteParams),
    ).toThrow();
  });

  it('should throw if serviceFee is invalid', () => {
    const params = {
      ...validParams,
      serviceFee: {
        percentageCut: 'five', // Invalid type
        toAddress: '0.0.6000',
      },
    };
    expect(() => HederaUtils.isValidInitiateSwapParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidTransferCryptoParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      transfers: [
        {
          assetType: 'TOKEN',
          to: '0.0.1234',
          amount: 100,
          assetId: '0.0.5678',
        },
        {
          assetType: 'HBAR',
          to: '0.0.1235',
          amount: 50,
        },
      ],
      memo: 'Transaction for testing',
      maxFee: 1000,
      serviceFee: {
        percentageCut: 5,
        toAddress: '0.0.6000',
      },
    };
  });

  it('should validate when all valid parameters are provided', () => {
    expect(() =>
      HederaUtils.isValidTransferCryptoParams(validParams),
    ).not.toThrow();
  });

  it('should throw if transfers array is empty', () => {
    const params = { ...validParams, transfers: [] };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });

  it('should throw if assetType is missing', () => {
    const params = {
      ...validParams,
      transfers: [{ ...validParams.transfers[0], assetType: undefined }],
    };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });

  it('should throw if "to" address is missing', () => {
    const params = {
      ...validParams,
      transfers: [{ ...validParams.transfers[0], to: undefined }],
    };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });

  it('should throw if "amount" is not a number', () => {
    const params = {
      ...validParams,
      transfers: [{ ...validParams.transfers[0], amount: 'not a number' }],
    };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });

  it('should throw if "assetId" is missing for TOKEN', () => {
    const params = {
      ...validParams,
      transfers: [
        { ...validParams.transfers[0], assetId: undefined }, // TOKEN transfer without assetId
      ],
    };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });

  it('should validate service fee structure', () => {
    const params = {
      ...validParams,
      serviceFee: { percentageCut: 'invalid type', toAddress: '0.0.6000' },
    };
    expect(() => HederaUtils.isValidTransferCryptoParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidGetTransactionsParams', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      transactionId: '0.0.1234@111122223333', // Example of a typical transaction ID format
    };
  });

  it('should validate when a valid transactionId is provided', () => {
    expect(() =>
      HederaUtils.isValidGetTransactionsParams(validParams),
    ).not.toThrow();
  });

  it('should throw if transactionId is empty', () => {
    const params = { ...validParams, transactionId: '' };
    expect(() => HederaUtils.isValidGetTransactionsParams(params)).toThrow();
  });
});

describe('HederaUtils.isValidGetAccountInfoRequest', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      accountId: '0.0.1234',
      fetchUsingMirrorNode: true, // Optional boolean parameter
    };
  });

  it('should validate when valid accountId is provided', () => {
    expect(() =>
      HederaUtils.isValidGetAccountInfoRequest(validParams),
    ).not.toThrow();
  });

  it('should throw if accountId is empty', () => {
    const params = { ...validParams, accountId: '' };
    expect(() => HederaUtils.isValidGetAccountInfoRequest(params)).toThrow();
  });

  it('should validate if fetchUsingMirrorNode is a boolean', () => {
    const params = { ...validParams, fetchUsingMirrorNode: 'true' }; // Incorrect type
    expect(() => HederaUtils.isValidGetAccountInfoRequest(params)).toThrow();
  });

  it('should handle optional fetchUsingMirrorNode correctly', () => {
    const params = { ...validParams };
    delete params.fetchUsingMirrorNode; // It's optional, should not throw
    expect(() =>
      HederaUtils.isValidGetAccountInfoRequest(params),
    ).not.toThrow();
  });

  it('should validate serviceFee structure if present', () => {
    const params = {
      ...validParams,
      serviceFee: {
        percentageCut: 10,
        toAddress: '0.0.6000',
      },
    };
    expect(() =>
      HederaUtils.isValidGetAccountInfoRequest(params),
    ).not.toThrow();
  });

  it('should throw if serviceFee structure is invalid', () => {
    const params = {
      ...validParams,
      serviceFee: {
        percentageCut: 'ten percent', // Invalid type
        toAddress: 6000, // Invalid type
      },
    };
    expect(() => HederaUtils.isValidGetAccountInfoRequest(params)).toThrow();
  });
});

describe('HederaUtils.isValidSignMessageRequest', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      message: 'Hello, Hedera!',
    };
  });

  it('should validate when a valid message is provided', () => {
    expect(() =>
      HederaUtils.isValidSignMessageRequest(validParams),
    ).not.toThrow();
  });

  it('should throw if message is missing', () => {
    const params = { ...validParams };
    delete params.message;
    expect(() => HederaUtils.isValidSignMessageRequest(params)).toThrow();
  });

  it('should throw if message is empty', () => {
    const params = { ...validParams, message: '' };
    expect(() => HederaUtils.isValidSignMessageRequest(params)).toThrow();
  });

  it('should throw if message is not a string', () => {
    const params = { ...validParams, message: 123 }; // Invalid type, should be a string
    expect(() => HederaUtils.isValidSignMessageRequest(params)).toThrow();
  });
});

describe('HederaUtils.isValidServiceFee', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      percentageCut: 10,
      toAddress: '0.0.1234',
    };
  });

  it('should validate when all valid service fee parameters are provided', () => {
    expect(() => HederaUtils.isValidServiceFee(validParams)).not.toThrow();
  });

  it('should throw if percentageCut is missing', () => {
    const params = { ...validParams };
    delete params.percentageCut;
    expect(() => HederaUtils.isValidServiceFee(params)).toThrow();
  });

  it('should throw if percentageCut is not a number', () => {
    const params = { ...validParams, percentageCut: 'ten percent' };
    expect(() => HederaUtils.isValidServiceFee(params)).toThrow();
  });

  it('should throw if percentageCut is negative', () => {
    const params = { ...validParams, percentageCut: -5 };
    expect(() => HederaUtils.isValidServiceFee(params)).toThrow();
  });

  it('should throw if toAddress is not a valid string', () => {
    const params = { ...validParams, toAddress: 1234 };
    expect(() => HederaUtils.isValidServiceFee(params)).toThrow();
  });
});

describe('HederaUtils.isExternalAccountFlagSet', () => {
  let validParams: any;
  let validExternalAccount: any;

  beforeEach(() => {
    validExternalAccount = {
      accountIdOrEvmAddress: '0.0.1234',
      curve: 'ED25519',
    };
    validParams = {
      externalAccount: validExternalAccount,
    };
  });

  it('should return true when external account flag is set correctly', () => {
    expect(HederaUtils.isExternalAccountFlagSet(validParams)).toBe(true);
  });

  it('should return false if externalAccount is missing', () => {
    const params = {};
    expect(HederaUtils.isExternalAccountFlagSet(params)).toBe(false);
  });

  it('should return false if externalAccount is null', () => {
    const params = { externalAccount: null };
    expect(HederaUtils.isExternalAccountFlagSet(params)).toBe(false);
  });

  it('should return false if accountIdOrEvmAddress is missing', () => {
    const params = {
      externalAccount: {
        ...validExternalAccount,
        accountIdOrEvmAddress: undefined,
      },
    };
    expect(HederaUtils.isExternalAccountFlagSet(params)).toBe(false);
  });

  it('should return false if accountIdOrEvmAddress is empty', () => {
    const params = {
      externalAccount: { ...validExternalAccount, accountIdOrEvmAddress: '' },
    };
    expect(() => HederaUtils.isExternalAccountFlagSet(params)).toThrow();
  });

  it('should return false if curve is incorrect', () => {
    const params = {
      externalAccount: { ...validExternalAccount, curve: 'invalid_curve' },
    };
    expect(() => HederaUtils.isExternalAccountFlagSet(params)).toThrow();
  });
});

describe('HederaUtils.getNetworkInfoFromUser', () => {
  it('should return mainnet info when no params are provided', () => {
    const expectedOutput = {
      network: 'mainnet',
      mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    };
    const result = HederaUtils.getNetworkInfoFromUser({});
    expect(result).toEqual(expectedOutput);
  });

  it('should return correct network and mirrorNodeUrl for provided valid network', () => {
    const params = { network: 'testnet' };
    const expectedOutput = {
      network: 'testnet',
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    };
    const result = HederaUtils.getNetworkInfoFromUser(params);
    expect(result).toEqual(expectedOutput);
  });

  it('should throw an error for invalid network', () => {
    const params = { network: 'invalidnet' };
    expect(() => HederaUtils.getNetworkInfoFromUser(params)).toThrow(
      `Invalid Hedera network 'invalidnet'. Valid networks are 'mainnet, testnet, previewnet'`,
    );
  });

  it('should validate and set custom mirrorNodeUrl if provided', () => {
    const params = {
      network: 'mainnet',
      mirrorNodeUrl: 'https://custom.mirrornode.hedera.com',
    };
    const expectedOutput = {
      network: 'mainnet',
      mirrorNodeUrl: 'https://custom.mirrornode.hedera.com',
    };
    const result = HederaUtils.getNetworkInfoFromUser(params);
    expect(result).toEqual(expectedOutput);
  });
});

describe('HederaUtils.checkValidPublicKey', () => {
  let validParams: any;

  beforeEach(() => {
    validParams = {
      parameter: {
        publicKey:
          '02f9291bec57224d13c8367b4cb47b197fc403515dd4721a15d937e6f89f267d47',
      },
      methodName: 'createAccount',
      propertyName: 'publicKey',
      isRequired: true,
    };
  });

  it('should validate when a valid publicKey is provided', () => {
    expect(() =>
      HederaUtils.checkValidPublicKey(
        validParams.parameter,
        validParams.methodName,
        validParams.propertyName,
        validParams.isRequired,
      ),
    ).not.toThrow();
  });

  it('should throw if publicKey is missing and isRequired is true', () => {
    const params = { ...validParams, parameter: {} };
    expect(() =>
      HederaUtils.checkValidPublicKey(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow();
  });

  it('should throw if publicKey is not a string', () => {
    const params = { ...validParams, parameter: { publicKey: 123456 } };
    expect(() =>
      HederaUtils.checkValidPublicKey(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow();
  });

  it('should throw if publicKey is empty', () => {
    const params = { ...validParams, parameter: { publicKey: '' } };
    expect(() =>
      HederaUtils.checkValidPublicKey(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow();
  });

  it('should not throw if publicKey is missing and isRequired is false', () => {
    const params = { ...validParams, parameter: {}, isRequired: false };
    expect(() =>
      HederaUtils.checkValidPublicKey(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).not.toThrow();
  });
});

describe('HederaUtils.checkValidTimestamp', () => {
  const validParams = {
    parameter: {
      timestamp: '2022-01-01T12:00:00',
    },
    methodName: 'scheduleTransaction',
    propertyName: 'timestamp',
    isRequired: true,
  };

  it('should validate when a valid timestamp is provided', () => {
    expect(() =>
      HederaUtils.checkValidTimestamp(
        validParams.parameter,
        validParams.methodName,
        validParams.propertyName,
        validParams.isRequired,
      ),
    ).not.toThrow();
  });

  it('should throw if timestamp is missing and isRequired is true', () => {
    const params = { ...validParams, parameter: {} };
    expect(() =>
      HederaUtils.checkValidTimestamp(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow(
      `Invalid ${params.methodName} Params passed. "${params.propertyName}" must be passed`,
    );
  });

  it('should throw if timestamp is not a string', () => {
    const params = { ...validParams, parameter: { timestamp: 1234567890 } };
    expect(() =>
      HederaUtils.checkValidTimestamp(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow();
  });

  it('should throw if timestamp format is invalid', () => {
    const params = { ...validParams, parameter: { timestamp: '2022-01-99' } };
    expect(() =>
      HederaUtils.checkValidTimestamp(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).toThrow();
  });

  it('should not throw if timestamp is missing and isRequired is false', () => {
    const params = { ...validParams, parameter: {}, isRequired: false };
    expect(() =>
      HederaUtils.checkValidTimestamp(
        params.parameter,
        params.methodName,
        params.propertyName,
        params.isRequired,
      ),
    ).not.toThrow();
  });
});

describe('HederaUtils.checkValidNumber', () => {
  const methodName = 'testMethod';
  const propertyName = 'testNumber';

  it('should validate when a valid number is provided', () => {
    const parameter = { testNumber: 100 };
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).not.toThrow();
  });

  it('should throw if number is missing and isRequired is true', () => {
    const parameter = {};
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).toThrow(
      `Invalid ${methodName} Params passed. "${propertyName}" must be passed`,
    );
  });

  it('should throw if number is not a number', () => {
    const parameter = { testNumber: 'not a number' };
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).toThrow(
      `Invalid ${methodName} Params passed. "${propertyName}" must be a number`,
    );
  });

  it('should throw if number is negative', () => {
    const parameter = { testNumber: -1 };
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).toThrow(
      `Invalid ${methodName} Params passed. "${propertyName}" must be a number`,
    );
  });

  it('should not throw if number is missing and isRequired is false', () => {
    const parameter = {};
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, false),
    ).not.toThrow();
  });

  it('should validate zero as a valid number', () => {
    const parameter = { testNumber: 0 };
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).not.toThrow();
  });

  it('should validate decimal numbers correctly', () => {
    const parameter = { testNumber: 123.456 };
    expect(() =>
      HederaUtils.checkValidNumber(parameter, methodName, propertyName, true),
    ).not.toThrow();
  });
});

describe('HederaUtils.checkRequiredProperty', () => {
  const methodName = 'testMethod';
  const propertyName = 'testProperty';

  it('should not throw if property is present and isRequired is true', () => {
    const parameter = { testProperty: 'value' };
    expect(() =>
      HederaUtils.checkRequiredProperty(
        parameter,
        methodName,
        propertyName,
        true,
      ),
    ).not.toThrow();
  });

  it('should throw if property is missing and isRequired is true', () => {
    const parameter = {};
    expect(() =>
      HederaUtils.checkRequiredProperty(
        parameter,
        methodName,
        propertyName,
        true,
      ),
    ).toThrow();
  });

  it('should not throw if property is missing and isRequired is false', () => {
    const parameter = {};
    expect(() =>
      HederaUtils.checkRequiredProperty(
        parameter,
        methodName,
        propertyName,
        false,
      ),
    ).not.toThrow();
  });

  it('should not throw if property is present and isRequired is false', () => {
    const parameter = { testProperty: 'value' };
    expect(() =>
      HederaUtils.checkRequiredProperty(
        parameter,
        methodName,
        propertyName,
        false,
      ),
    ).not.toThrow();
  });

  it('should throw with a detailed error message if property is missing', () => {
    const parameter = {};
    try {
      HederaUtils.checkRequiredProperty(
        parameter,
        methodName,
        propertyName,
        true,
      );
    } catch (error: any) {
      expect(error.message).toBe(
        `Invalid ${methodName} Params passed. "${propertyName}" must be passed`,
      );
    }
  });
});
