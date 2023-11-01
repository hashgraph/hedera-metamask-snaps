import BigNumber from 'bignumber.js';
import {
  AccountBalance,
  SimpleHederaClient,
  SimpleTransfer,
} from 'src/services/hedera';
import { TUUMACCOUNTID } from '../types/constants';

export type QueryCost = {
  serviceFee: number;
  estimatedCost: number;
  maxCost: number;
};

export const calculateHederaQueryFees = (queryCost: BigNumber): QueryCost => {
  const serviceFee = queryCost.multipliedBy(0.01); // 1% service fee to Tuum Tech for the query; This can be changed in the future

  const estimatedCost = queryCost.plus(serviceFee);

  // add a 5% margin to allow for spot fluctuations
  const maxCost = estimatedCost.multipliedBy(1.05);

  const serviceFeeResult = Number(serviceFee.toFixed(8));
  const estimatedCostResult = Number(estimatedCost.toFixed(8));
  const maxCostResult = Number(maxCost.toFixed(8));

  return {
    serviceFee: serviceFeeResult,
    estimatedCost: estimatedCostResult,
    maxCost: maxCostResult,
  } as QueryCost;
};

export const deductServiceFee = async (
  currentBalance: AccountBalance,
  serviceFee: number,
  hederaClient: SimpleHederaClient,
) => {
  try {
    const transfers: SimpleTransfer[] = [
      {
        asset: 'HBAR',
        to: TUUMACCOUNTID,
        amount: serviceFee,
      } as SimpleTransfer,
    ];
    await hederaClient.transferCrypto({
      currentBalance,
      transfers,
      memo: null,
      maxFee: null,
      serviceFees: null,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-empty
  }
};
