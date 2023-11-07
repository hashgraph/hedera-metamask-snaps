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
    // eslint-disable-next-line no-empty
  }
};
