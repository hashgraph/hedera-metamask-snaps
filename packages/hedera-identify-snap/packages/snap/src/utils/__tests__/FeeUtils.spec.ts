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

import { FeeUtils } from '../FeeUtils';
import BigNumber from 'bignumber.js';

describe('FeeUtils.calculateHederaQueryFees', () => {
  test('should calculate correct service fees and max cost', () => {
    const queryCost = new BigNumber(100);
    const serviceFeePercentage = 10;

    const result = FeeUtils.calculateHederaQueryFees(
      queryCost,
      serviceFeePercentage,
    );

    const expectedServiceFee = 10;
    const expectedMaxCost = 115.5;

    expect(result.serviceFeeToPay).toBeCloseTo(expectedServiceFee, 2);
    expect(result.maxCost).toBeCloseTo(expectedMaxCost, 2);
  });

  test('should handle fractional costs correctly', () => {
    const queryCost = new BigNumber(50.25);
    const serviceFeePercentage = 15;

    const result = FeeUtils.calculateHederaQueryFees(
      queryCost,
      serviceFeePercentage,
    );

    const expectedServiceFee = 7.5375;
    const expectedMaxCost = (50.25 + 7.5375) * 1.05;

    expect(result.serviceFeeToPay).toBeCloseTo(expectedServiceFee, 2);
    expect(result.maxCost).toBeCloseTo(expectedMaxCost, 2);
  });

  test('should calculate zero fees correctly when query cost is zero', () => {
    const queryCost = new BigNumber(0);
    const serviceFeePercentage = 10;

    const result = FeeUtils.calculateHederaQueryFees(
      queryCost,
      serviceFeePercentage,
    );

    expect(result.serviceFeeToPay).toEqual(0);
    expect(result.maxCost).toEqual(0);
  });
});
