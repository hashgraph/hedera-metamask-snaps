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

import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import {
  AccountBalance,
  SimpleHederaClient,
  SimpleTransfer,
} from 'src/services/hedera';

export type QueryCost = {
  serviceFeeToPay: number;
  maxCost: number;
};

export const calculateHederaQueryFees = (
  queryCost: BigNumber,
  serviceFeePercentage: number,
): QueryCost => {
  const serviceFee = queryCost.multipliedBy(serviceFeePercentage / 100.0); // The service fee is configurable

  const totalQueryCost = queryCost.plus(serviceFee);

  // add a 5% margin to allow for spot fluctuations
  const maxCost = totalQueryCost.multipliedBy(1.05);

  const serviceFeeResult = Number(serviceFee.toFixed(8));
  const maxCostResult = Number(maxCost.toFixed(8));

  return {
    serviceFeeToPay: serviceFeeResult,
    maxCost: maxCostResult,
  } as QueryCost;
};

export const deductServiceFee = async (
  currentBalance: AccountBalance,
  serviceFeeToPay: number,
  serviceFeeToAddr: string,
  hederaClient: SimpleHederaClient,
) => {
  try {
    let toAddress: string = serviceFeeToAddr;
    if (ethers.isAddress(toAddress)) {
      toAddress = `0.0.${toAddress.slice(2)}`;
    }

    const transfers: SimpleTransfer[] = [
      {
        asset: 'HBAR',
        to: toAddress,
        amount: serviceFeeToPay,
      } as SimpleTransfer,
    ];
    await hederaClient.transferCrypto({
      currentBalance,
      transfers,
      memo: null,
      maxFee: null,
      serviceFeesToPay: null,
      serviceFeeToAddress: null,
    });
  } catch (error: any) {
    console.error('Error while deducting service fee: ', error);
  }
};
