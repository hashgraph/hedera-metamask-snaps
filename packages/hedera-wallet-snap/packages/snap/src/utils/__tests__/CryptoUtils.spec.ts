/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { CryptoUtils } from '../CryptoUtils';
import { ethers } from 'ethers';
import { mocked } from 'jest-mock';

jest.mock('ethers');
const mockedIsHexString = mocked(ethers.isHexString);

describe('CryptoUtils', () => {
  describe('isValidEthereumPublicKey', () => {
    beforeEach(() => {
      mockedIsHexString.mockClear();
    });

    it('should validate an Ethereum public key', () => {
      const publicKey =
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      mockedIsHexString.mockReturnValue(true);

      const result = CryptoUtils.isValidEthereumPublicKey(publicKey);
      expect(result).toBeTruthy();
      expect(mockedIsHexString).toHaveBeenCalledWith(publicKey);
    });

    it('should return false for invalid hex strings', () => {
      const publicKey = '0x123';
      mockedIsHexString.mockReturnValue(false);

      const result = CryptoUtils.isValidEthereumPublicKey(publicKey);
      expect(result).toBeFalsy();
    });
  });

  describe('stringToUint8Array', () => {
    it('should convert a string to Uint8Array', () => {
      const testString = 'test';
      const result = CryptoUtils.stringToUint8Array(testString);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new TextEncoder().encode(testString));
    });
  });

  describe('uint8ArrayToHex', () => {
    it('should convert a Uint8Array to a hex string', () => {
      const testArray = new Uint8Array([171, 205]);
      const expectedResult = 'abcd';
      const result = CryptoUtils.uint8ArrayToHex(testArray);
      expect(result).toBe(expectedResult);
    });

    it('should return an empty string for null input', () => {
      const result = CryptoUtils.uint8ArrayToHex(null);
      expect(result).toBe('');
    });
  });

  describe('hexToUInt8Array', () => {
    it('should convert a hex string to Uint8Array', () => {
      const hexString = 'abcd';
      const result = CryptoUtils.hexToUInt8Array(hexString);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([171, 205]));
    });

    it('should throw an error for invalid hex strings', () => {
      const hexString = 'abc';
      expect(() => CryptoUtils.hexToUInt8Array(hexString)).toThrow(
        'Invalid hex string',
      );
    });
  });
});
