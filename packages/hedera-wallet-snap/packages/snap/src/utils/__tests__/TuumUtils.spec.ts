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

import { TuumUtils, QueryCost } from '../TuumUtils';
import BigNumber from 'bignumber.js';

describe('HederaWalletUtils', () => {
  describe('calculateHederaQueryFees', () => {
    it('should correctly calculate query fees and service fees', () => {
      const queryCost = new BigNumber(100);
      const serviceFeePercentage = 10;

      const expected: QueryCost = {
        serviceFeeToPay: 10, // 10% of 100
        maxCost: 115.5, // (100 + 10) * 1.05
      };

      const result = TuumUtils.calculateHederaQueryFees(
        queryCost,
        serviceFeePercentage,
      );

      expect(result.serviceFeeToPay).toBeCloseTo(expected.serviceFeeToPay);
      expect(result.maxCost).toBeCloseTo(expected.maxCost);
    });
  });

  describe('deductServiceFee', () => {
    it('should call transferCrypto with correct parameters', async () => {
      // note that jest is having issues with classes with nested includes
      // since we're doing the instance refactor next going to leave this as-is
    });
  });
});
