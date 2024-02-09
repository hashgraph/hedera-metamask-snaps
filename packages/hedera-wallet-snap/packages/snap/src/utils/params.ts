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

import { AccountId } from '@hashgraph/sdk';
import { providerErrors } from '@metamask/rpc-errors';
import _ from 'lodash';
import normalizeUrl from 'normalize-url';
import { ExternalAccount } from '../types/account';
import {
  ApproveAllowanceRequestParams,
  AssociateTokensRequestParams,
  DeleteAccountRequestParams,
  DeleteAllowanceRequestParams,
  GetAccountInfoRequestParams,
  GetTransactionsRequestParams,
  MirrorNodeParams,
  ServiceFee,
  SignMessageRequestParams,
  StakeHbarRequestParams,
  TransferCryptoRequestParams,
} from '../types/params';

/**
 * Check Validation of MirrorNode flag.
 *
 * @param params - Request params.
 * @returns MirrornodeUrl.
 */
export function getMirrorNodeFlagIfExists(params: unknown): string {
  let mirrorNodeUrl = '';
  if (
    params !== null &&
    typeof params === 'object' &&
    'mirrorNodeUrl' in params
  ) {
    const parameter = params as MirrorNodeParams;

    if (
      parameter.mirrorNodeUrl === null ||
      typeof parameter.mirrorNodeUrl !== 'string'
    ) {
      console.error(
        'Invalid MirrorNode Params passed. "mirrorNodeUrl" must be a string',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid MirrorNode Params passed. "mirrorNodeUrl" must be a string',
      );
    }

    if (!_.isEmpty(parameter.mirrorNodeUrl)) {
      mirrorNodeUrl = normalizeUrl(parameter.mirrorNodeUrl);
    }
  }

  return mirrorNodeUrl;
}

/**
 * Check whether the the account was imported using private key(external account).
 *
 * @param params - Request params.
 * @returns Whether to treat it as an external account that was imported using private key.
 */
export function isExternalAccountFlagSet(params: unknown): boolean {
  if (
    params !== null &&
    typeof params === 'object' &&
    'externalAccount' in params &&
    params.externalAccount !== null &&
    typeof params.externalAccount === 'object'
  ) {
    const parameter = params as ExternalAccount;

    if ('accountIdOrEvmAddress' in parameter.externalAccount) {
      if (
        parameter.externalAccount.accountIdOrEvmAddress !== null &&
        typeof parameter.externalAccount.accountIdOrEvmAddress === 'string'
      ) {
        if (_.isEmpty(parameter.externalAccount.accountIdOrEvmAddress)) {
          console.error(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
        }
        if (
          'curve' in parameter.externalAccount &&
          parameter.externalAccount.curve !== null
        ) {
          if (
            typeof parameter.externalAccount.curve !== 'string' ||
            (parameter.externalAccount.curve !== 'ECDSA_SECP256K1' &&
              parameter.externalAccount.curve !== 'ED25519')
          ) {
            console.error(
              'Invalid externalAccount Params passed. "curve" must be a string and must be either "ECDSA_SECP256K1" or "ED25519"',
            );
            throw providerErrors.unsupportedMethod(
              'Invalid externalAccount Params passed. "curve" must be a string and must be either "ECDSA_SECP256K1" or "ED25519"',
            );
          }
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * Check Validation of serviceFee request.
 *
 * @param params - Request params.
 */
function isValidServiceFee(params: unknown): asserts params is ServiceFee {
  const parameter = params as ServiceFee;

  // Check if serviceFee.percentageCut is valid
  if (
    _.isNull(parameter.percentageCut) ||
    typeof parameter.percentageCut !== 'number' ||
    !Number.isFinite(parameter.percentageCut)
  ) {
    console.error(
      'Invalid Params passed. "serviceFee.percentageCut" must be a number',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid Params passed. "serviceFee.percentageCut" must be a number',
    );
  }
  // Check if serviceFee.toAddress is valid
  if (
    _.isNull(parameter.toAddress) ||
    typeof parameter.toAddress !== 'string' ||
    _.isEmpty(parameter.toAddress)
  ) {
    console.error(
      'Invalid Params passed. "serviceFee.toAddress" must be a string and must not be empty',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid Params passed. "serviceFee.toAddress" must be a string and must not be empty',
    );
  }
}

/**
 * Check Validation of signMessage request.
 *
 * @param params - Request params.
 */
export function isValidSignMessageRequest(
  params: unknown,
): asserts params is SignMessageRequestParams {
  if (params === null || _.isEmpty(params) || !('message' in params)) {
    console.error(
      'Invalid signMessage Params passed. "message" must be passed as a parameter',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid signMessage Params passed. "message" must be passed as a parameter',
    );
  }

  const parameter = params as SignMessageRequestParams;

  // Check if message is valid
  if (
    'header' in parameter &&
    (_.isNull(parameter.header) || typeof parameter.header !== 'string')
  ) {
    console.error(
      'Invalid signMessage Params passed. "header" is not a string',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid signMessage Params passed. "header" is not a string',
    );
  }

  // Check if message is valid
  if (
    'message' in parameter &&
    (typeof parameter.message !== 'string' || _.isEmpty(parameter.message))
  ) {
    console.error(
      'Invalid signMessage Params passed. "message" is not a string or is empty',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid signMessage Params passed. "message" is not a string or is empty',
    );
  }
}

/**
 * Check Validation of getAccountInfo request.
 *
 * @param params - Request params.
 */
export function isValidGetAccountInfoRequest(
  params: unknown,
): asserts params is GetAccountInfoRequestParams {
  const parameter = params as GetAccountInfoRequestParams;

  // Check if accountId is valid
  if (
    'accountId' in parameter &&
    (typeof parameter.accountId !== 'string' ||
      _.isEmpty(parameter.accountId) ||
      !AccountId.fromString(parameter.accountId))
  ) {
    console.error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string and be a valid Hedera Account Id',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid getAccountInfo Params passed. "accountId" must be a string and be a valid Hedera Account Id',
    );
  }

  // Check if serviceFee is valid
  if (
    'serviceFee' in parameter &&
    !_.isNull(parameter.serviceFee) &&
    parameter.serviceFee !== undefined
  ) {
    isValidServiceFee(parameter.serviceFee);
  }
}

/**
 * Check Validation of getTransactions request.
 *
 * @param params - Request params.
 */
export function isValidGetTransactionsParams(
  params: unknown,
): asserts params is GetTransactionsRequestParams {
  const parameter = params as GetTransactionsRequestParams;

  // Check if accountId is valid
  if (
    'transactionId' in parameter &&
    (typeof parameter.transactionId !== 'string' ||
      _.isEmpty(parameter.transactionId))
  ) {
    console.error(
      'Invalid getTransactions Params passed. "transactionId" must be a string',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid getTransactions Params passed. "transactionId" must be a string',
    );
  }
}

/**
 * Check Validation of associateTokens request.
 *
 * @param params - Request params.
 */
export function isValidAssociateTokensParams(
  params: unknown,
): asserts params is AssociateTokensRequestParams {
  if (params === null || _.isEmpty(params) || !('tokenIds' in params)) {
    console.error(
      'Invalid associateTokens Params passed. "tokenIds" must be passed as a parameter',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid associateTokens Params passed. "tokenIds" must be passed as a parameter',
    );
  }

  const parameter = params as AssociateTokensRequestParams;

  // Check if tokenIds is valid
  if (
    'tokenIds' in parameter &&
    (_.isEmpty(parameter.tokenIds) || !Array.isArray(parameter.tokenIds))
  ) {
    console.error(
      'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
    );
  }
  parameter.tokenIds.forEach((tokenId: string) => {
    if (_.isEmpty(tokenId)) {
      console.error(
        'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
      );
    }
  });
}

/**
 * Check Validation of transferCrypto request.
 *
 * @param params - Request params.
 */
export function isValidTransferCryptoParams(
  params: unknown,
): asserts params is TransferCryptoRequestParams {
  if (params === null || _.isEmpty(params) || !('transfers' in params)) {
    console.error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
  }

  const parameter = params as TransferCryptoRequestParams;

  // Check if memo is valid
  if (
    'memo' in parameter &&
    (_.isNull(parameter.memo) || typeof parameter.memo !== 'string')
  ) {
    console.error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
    throw providerErrors.unsupportedMethod(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
  }

  // Check if maxFee is valid
  if (
    'maxFee' in parameter &&
    (_.isNull(parameter.maxFee) ||
      typeof parameter.maxFee !== 'number' ||
      !Number.isFinite(parameter.maxFee))
  ) {
    console.error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
    throw providerErrors.unsupportedMethod(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
  }

  // Check if serviceFee is valid
  if (
    'serviceFee' in parameter &&
    !_.isNull(parameter.serviceFee) &&
    parameter.serviceFee !== undefined
  ) {
    isValidServiceFee(parameter.serviceFee);
  }

  // Check if transfers is valid
  if (parameter.transfers) {
    parameter.transfers.forEach((transfer: object) => {
      // Check if assetType is valid
      if (
        !('assetType' in transfer) ||
        typeof transfer.assetType !== 'string' ||
        !(
          transfer.assetType === 'HBAR' ||
          transfer.assetType === 'TOKEN' ||
          transfer.assetType === 'NFT'
        )
      ) {
        console.error(
          'Invalid transferCrypto Params passed. "transfers[].assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid transferCrypto Params passed. "transfers[].assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
        );
      }
      if (transfer.assetType === 'HBAR' && 'assetId' in transfer) {
        console.error(
          'Invalid transferCrypto Params passed. "transfers[].assetId" cannot be passed for "HBAR" assetType',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid transferCrypto Params passed. "transfers[].assetId" cannot be passed for "HBAR" assetType',
        );
      } else if (
        (transfer.assetType === 'TOKEN' || transfer.assetType === 'NFT') &&
        !('assetId' in transfer)
      ) {
        console.error(
          'Invalid transferCrypto Params passed. "transfers[].assetId" must be passed for "TOKEN/NFT" assetType',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid transferCrypto Params passed. "transfers[].assetId" must be passed for "TOKEN/NFT" assetType',
        );
      }

      // Check if to is valid
      if (
        !('to' in transfer) ||
        typeof transfer.to !== 'string' ||
        _.isEmpty(transfer.to)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
        throw providerErrors.unsupportedMethod(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
      }
      // Check if amount is valid
      if (
        !('amount' in transfer) ||
        typeof transfer.amount !== 'number' ||
        !Number.isFinite(transfer.amount)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].amount" is not a number`,
        );
        throw providerErrors.unsupportedMethod(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a number`,
        );
      }

      // Check if assetId is valid
      if (
        transfer.assetType !== 'HBAR' &&
        'assetId' in transfer &&
        (_.isEmpty(transfer.assetId) || typeof transfer.assetId !== 'string')
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].assetId" is not a string or is empty`,
        );
        throw providerErrors.unsupportedMethod(
          `Invalid transferCrypto Params passed. "transfers[].assetId" is not a string or is empty`,
        );
      }

      // Check if from is valid
      if (
        'from' in transfer &&
        (_.isEmpty(transfer.from) ||
          typeof transfer.from !== 'string' ||
          !AccountId.fromString(transfer.from))
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].from" is not a valid Account ID`,
        );
        throw providerErrors.unsupportedMethod(
          `Invalid transferCrypto Params passed. "transfers[].from" is not a valid Account ID`,
        );
      }
    });
  }
}

/**
 * Check Validation of stakeHbar request.
 *
 * @param params - Request params.
 */
export function isValidStakeHbarParams(
  params: unknown,
): asserts params is StakeHbarRequestParams {
  if (
    params === null ||
    _.isEmpty(params) ||
    !('nodeId' in params || 'accountId' in params)
  ) {
    const errMessage =
      'Invalid stakeHbar Params passed. Pass either "nodeId" or "accountId" as a parameter';
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  const parameter = params as StakeHbarRequestParams;

  // Check if nodeId is valid
  if (
    'nodeId' in parameter &&
    !_.isNull(parameter.nodeId) &&
    (typeof parameter.nodeId !== 'number' || !Number.isFinite(parameter.nodeId))
  ) {
    const errMessage =
      'Invalid stakeHbar Params passed. "nodeId" is not a valid Node ID';
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }

  // Check if accountId is valid
  if (
    'accountId' in parameter &&
    !_.isNull(parameter.accountId) &&
    (typeof parameter.accountId !== 'string' ||
      _.isEmpty(parameter.accountId) ||
      !AccountId.fromString(parameter.accountId))
  ) {
    const errMessage =
      'Invalid stakeHbar Params passed. "accountId" is not a valid Hedera Account Id';
    console.error(errMessage);
    throw providerErrors.unsupportedMethod(errMessage);
  }
}

/**
 * Check Validation of deleteAccount request.
 *
 * @param params - Request params.
 */
export function isValidDeleteAccountParams(
  params: unknown,
): asserts params is DeleteAccountRequestParams {
  if (
    params === null ||
    _.isEmpty(params) ||
    !('transferAccountId' in params)
  ) {
    console.error(
      'Invalid deleteAccount Params passed. "transferAccountId" must be passed as a parameter',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAccount Params passed. "transferAccountId" must be passed as a parameter',
    );
  }

  const parameter = params as DeleteAccountRequestParams;

  // Check if transferAccountId is valid
  if (
    'transferAccountId' in parameter &&
    (_.isEmpty(parameter.transferAccountId) ||
      typeof parameter.transferAccountId !== 'string' ||
      !AccountId.fromString(parameter.transferAccountId))
  ) {
    console.error(
      'Invalid deleteAccount Params passed. "transferAccountId" is not a valid Account ID',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAccount Params passed. "transferAccountId" is not a valid Account ID',
    );
  }
}

/**
 * Check Validation of approveAllowance request.
 *
 * @param params - Request params.
 */
export function isValidApproveAllowanceParams(
  params: unknown,
): asserts params is ApproveAllowanceRequestParams {
  if (
    params === null ||
    _.isEmpty(params) ||
    !('spenderAccountId' in params) ||
    !('amount' in params) ||
    !('assetType' in params)
  ) {
    console.error(
      'Invalid approveAllowance Params passed. "spenderAccountId", "amount" and "assetType" must be passed as parameters',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "spenderAccountId", "amount" and "assetType" must be passed as parameters',
    );
  }

  const parameter = params as ApproveAllowanceRequestParams;

  // Check if spenderAccountId is valid
  if (
    'spenderAccountId' in parameter &&
    (_.isEmpty(parameter.spenderAccountId) ||
      typeof parameter.spenderAccountId !== 'string' ||
      !AccountId.fromString(parameter.spenderAccountId))
  ) {
    console.error(
      'Invalid approveAllowance Params passed. "spenderAccountId" is not a valid Account ID',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "spenderAccountId" is not a valid Account ID',
    );
  }

  // Check if amount is valid
  if (
    'amount' in parameter &&
    (typeof parameter.amount !== 'number' || parameter.amount <= 0)
  ) {
    console.error(
      'Invalid approveAllowance Params passed. "amount" is not a valid number',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "amount" is not a valid number',
    );
  }

  // Check if assetType is valid
  if (
    'assetType' in parameter &&
    (_.isEmpty(parameter.assetType) ||
      typeof parameter.assetType !== 'string' ||
      !(
        parameter.assetType === 'HBAR' ||
        parameter.assetType === 'TOKEN' ||
        parameter.assetType === 'NFT'
      ))
  ) {
    console.error(
      'Invalid approveAllowance Params passed. "assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
    );
  }
  if (parameter.assetType === 'HBAR' && !_.isEmpty(parameter.assetDetail)) {
    console.error(
      'Invalid approveAllowance Params passed. "assetDetail" cannot be passed for "HBAR" assetType',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "assetDetail" cannot be passed for "HBAR" assetType',
    );
  }
  if (
    parameter.assetType === 'TOKEN' &&
    (_.isEmpty(parameter.assetDetail) || 'all' in parameter.assetDetail)
  ) {
    console.error(
      'Invalid approveAllowance Params passed. "assetDetail" must be passed for "TOKEN" assetType',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "assetDetail" must be passed for "TOKEN" assetType',
    );
  }
  if (parameter.assetType === 'NFT' && _.isEmpty(parameter.assetDetail)) {
    console.error(
      'Invalid approveAllowance Params passed. "assetDetail" must be passed for "TOKEN/NFT" assetType',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "assetDetail" must be passed for "TOKEN/NFT" assetType',
    );
  }
}

/**
 * Check Validation of deleteAllowance request.
 *
 * @param params - Request params.
 */
export function isValidDeleteAllowanceParams(
  params: unknown,
): asserts params is DeleteAllowanceRequestParams {
  if (params === null || _.isEmpty(params) || !('assetType' in params)) {
    console.error(
      'Invalid deleteAllowance Params passed. "assetType" must be passed as a parameter',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAllowance Params passed. "assetType" must be passed as a parameter',
    );
  }

  const parameter = params as DeleteAllowanceRequestParams;

  // Check if assetType is valid
  if (
    'assetType' in parameter &&
    (_.isEmpty(parameter.assetType) ||
      typeof parameter.assetType !== 'string' ||
      !(
        parameter.assetType === 'HBAR' ||
        parameter.assetType === 'TOKEN' ||
        parameter.assetType === 'NFT'
      ))
  ) {
    console.error(
      'Invalid deleteAllowance Params passed. "assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAllowance Params passed. "assetType" is not a valid string. It can be one of the following: "HBAR", "TOKEN", "NFT"',
    );
  }
  if (parameter.assetType === 'HBAR' && !_.isEmpty(parameter.assetId)) {
    console.error(
      'Invalid approveAllowance Params passed. "assetId" cannot be passed for "HBAR" assetType',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid approveAllowance Params passed. "assetId" cannot be passed for "HBAR" assetType',
    );
  }

  // Check if spenderAccountId is valid
  if (
    (parameter.assetType === 'HBAR' || parameter.assetType === 'TOKEN') &&
    (_.isEmpty(parameter.spenderAccountId) ||
      typeof parameter.spenderAccountId !== 'string' ||
      !AccountId.fromString(parameter.spenderAccountId))
  ) {
    console.error(
      'Invalid deleteAllowance Params passed. "spenderAccountId" must be passed for "HBAR/TOKEN" assetType and must be a valid string',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAllowance Params passed. "spenderAccountId" must be passed for "HBAR/TOKEN" assetType and must be a valid string',
    );
  }

  // Check if assetId is valid
  if (
    (parameter.assetType === 'TOKEN' || parameter.assetType === 'NFT') &&
    (_.isEmpty(parameter.assetId) || typeof parameter.assetId !== 'string')
  ) {
    console.error(
      'Invalid deleteAllowance Params passed. "assetId" must be passed for "TOKEN/NFT" assetType and must be a valid string',
    );
    throw providerErrors.unsupportedMethod(
      'Invalid deleteAllowance Params passed. "assetId" must be passed for "TOKEN/NFT" assetType and must be a valid string',
    );
  }
}
