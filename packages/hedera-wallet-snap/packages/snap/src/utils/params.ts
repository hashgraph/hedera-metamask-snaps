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
import _ from 'lodash';
import normalizeUrl from 'normalize-url';
import { ExternalAccount } from '../types/account';
import {
  GetAccountInfoRequestParams,
  MirrorNodeParams,
  ServiceFee,
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
      throw new Error(
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
          throw new Error(
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
            throw new Error(
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
    typeof parameter.percentageCut !== 'number'
  ) {
    console.error(
      'Invalid Params passed. "serviceFee.percentageCut" must be a number',
    );
    throw new Error(
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
    throw new Error(
      'Invalid Params passed. "serviceFee.toAddress" must be a string and must not be empty',
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
    (_.isNull(parameter.accountId) ||
      typeof parameter.accountId !== 'string' ||
      _.isEmpty(parameter.accountId) ||
      !AccountId.fromString(parameter.accountId))
  ) {
    console.error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string and be a valid Hedera Account Id',
    );
    throw new Error(
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
    throw new Error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
  }

  const parameter = params as TransferCryptoRequestParams;

  if (parameter.transfers) {
    parameter.transfers.forEach((transfer: object) => {
      if (
        !('asset' in transfer) ||
        typeof transfer.asset !== 'string' ||
        _.isEmpty(transfer.asset)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
      }
      if (
        !('to' in transfer) ||
        typeof transfer.to !== 'string' ||
        _.isEmpty(transfer.to)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
      }
      if (!('amount' in transfer) || typeof transfer.amount !== 'number') {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].amount" is not a number`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a number`,
        );
      }
    });
  }

  // Check if memo is valid
  if (
    'memo' in parameter &&
    (_.isNull(parameter.memo) || typeof parameter.memo !== 'string')
  ) {
    console.error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
    throw new Error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
  }

  // Check if maxFee is valid
  if (
    'maxFee' in parameter &&
    (_.isNull(parameter.maxFee) || typeof parameter.maxFee !== 'number')
  ) {
    console.error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
    throw new Error(
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
}
