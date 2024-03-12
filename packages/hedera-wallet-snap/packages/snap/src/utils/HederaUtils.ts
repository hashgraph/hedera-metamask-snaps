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

import { AccountId, NftId, TokenId } from '@hashgraph/sdk';
import { StakingInfoJson } from '@hashgraph/sdk/lib/StakingInfo';
import { providerErrors } from '@metamask/rpc-errors';
import _ from 'lodash';
import normalizeUrl from 'normalize-url';
import {
  AccountBalance,
  MirrorAccountInfo,
  MirrorNftInfo,
  MirrorStakingInfo,
  MirrorTokenInfo,
  MirrorTransactionInfo,
  NetworkInfo,
  SimpleTransfer,
  Token,
  TokenBalance,
} from 'src/types/hedera';
import { AccountInfo, ExternalAccount, NetworkParams } from '../types/account';
import {
  DEFAULTHEDERAMIRRORNODES,
  hederaNetworks,
  isIn,
} from '../types/constants';
import {
  ApproveAllowanceRequestParams,
  AssociateTokensRequestParams,
  BurnTokenRequestParams,
  CreateTokenRequestParams,
  DeleteAccountRequestParams,
  DeleteAllowanceRequestParams, DeleteTokenRequestParams,
  DissociateTokensRequestParams,
  GetAccountInfoRequestParams,
  GetTransactionsRequestParams,
  MintTokenRequestParams,
  MirrorNodeParams,
  ServiceFee,
  SignMessageRequestParams,
  StakeHbarRequestParams,
  TokenCustomFee,
  TransferCryptoRequestParams,
} from '../types/params';
import { CryptoUtils } from './CryptoUtils';
import { FetchResponse, FetchUtils } from './FetchUtils';
import { Utils } from './Utils';

export class HederaUtils {
  /**
   * Checks if the specified property in the given object is passed.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkRequiredProperty(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    if (isRequired && !(propertyName in parameter)) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be passed`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be passed`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid string.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkValidString(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    HederaUtils.checkRequiredProperty(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid string
    if (
      propertyName in parameter &&
      (typeof parameter[propertyName] !== 'string' ||
        _.isEmpty(parameter[propertyName]))
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid boolean.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkValidBoolean(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    HederaUtils.checkRequiredProperty(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid boolean
    if (
      propertyName in parameter &&
      typeof parameter[propertyName] !== 'boolean'
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a boolean`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a boolean`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid number.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkValidNumber(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    HederaUtils.checkRequiredProperty(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid number
    if (
      propertyName in parameter &&
      (typeof parameter[propertyName] !== 'number' ||
        !Number.isFinite(parameter[propertyName]) ||
        parameter[propertyName] < 0)
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a number`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a number`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid timestamp.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkValidTimestamp(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    HederaUtils.checkRequiredProperty(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid timestamp

    // Regular expression for validating date in YYYY-MM-DD format
    // and date-time in YYYY-MM-DDTHH:mm:ss format
    const dateTimeRegex =
      /^\d{4}-[01]\d-[0-3]\d(?:T([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9])?$/u;

    if (
      propertyName in parameter &&
      (!dateTimeRegex.test(parameter[propertyName]) ||
        typeof parameter[propertyName] !== 'string' ||
        _.isEmpty(parameter[propertyName]))
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a valid date string in the format YYYY-MM-DD or date-time string in the format YYYY-MM-DDTHH:mm:ss`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a valid date string in the format YYYY-MM-DD or date-time string in the format YYYY-MM-DDTHH:mm:ss`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid public key.
   *
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static checkValidPublicKey(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    HederaUtils.checkRequiredProperty(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid string first
    HederaUtils.checkValidString(
      parameter,
      methodName,
      propertyName,
      isRequired,
    );
    // Check if the property exists and is a valid public key
    if (
      propertyName in parameter &&
      !(
        CryptoUtils.isValidEthereumPublicKey(parameter[propertyName]) ||
        CryptoUtils.isValidHederaPublicKey(parameter[propertyName])
      )
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a valid public key`,
      );
      throw providerErrors.unsupportedMethod(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a public key`,
      );
    }
  }

  /**
   * Check Validation of network flag and mirrorNodeUrl flag and return their values.
   *
   * @param params - Request params.
   * @returns Network and MirrorNodeUrl.
   */
  public static getNetworkInfoFromUser(params: unknown): NetworkInfo {
    const networkInfo = {
      network: 'mainnet',
      mirrorNodeUrl: DEFAULTHEDERAMIRRORNODES.mainnet,
    } as NetworkInfo;
    if (params !== null && typeof params === 'object' && 'network' in params) {
      const parameter = params as NetworkParams;

      // Check if network that was passed is valid
      if (!_.isEmpty(parameter.network)) {
        if (!HederaUtils.validHederaNetwork(parameter.network)) {
          console.error(
            `Invalid Hedera network '${
              parameter.network
            }'. Valid networks are '${hederaNetworks.join(', ')}'`,
          );

          throw providerErrors.unsupportedMethod(
            `Invalid Hedera network '${
              parameter.network
            }'. Valid networks are '${hederaNetworks.join(', ')}'`,
          );
        }
        networkInfo.network = parameter.network;
      }
    }

    if (networkInfo.network === 'testnet') {
      networkInfo.mirrorNodeUrl = DEFAULTHEDERAMIRRORNODES.testnet;
    }

    if (
      params !== null &&
      typeof params === 'object' &&
      'mirrorNodeUrl' in params
    ) {
      const parameter = params as MirrorNodeParams;

      // Check if mirrorNodeUrl that was passed is valid
      if (!_.isEmpty(parameter.mirrorNodeUrl)) {
        HederaUtils.checkValidString(
          parameter,
          'params',
          'mirrorNodeUrl',
          false,
        );
        const mirrorNodeUrl = parameter.mirrorNodeUrl as string;
        try {
          // eslint-disable-next-line no-new
          new URL(mirrorNodeUrl);
        } catch (error: any) {
          console.error(
            `Invalid mirrorNodeUrl '${mirrorNodeUrl}'. Error: ${String(error)}`,
          );

          throw providerErrors.unsupportedMethod(
            `Invalid mirrorNodeUrl '${mirrorNodeUrl}'. Error: ${String(error)}`,
          );
        }
        networkInfo.mirrorNodeUrl = normalizeUrl(mirrorNodeUrl);
      }
    }

    return networkInfo;
  }

  /**
   * Check whether the account was imported using private key(external account).
   *
   * @param params - Request params.
   * @returns Whether to treat it as an external account that was imported using private key.
   */

  public static isExternalAccountFlagSet(params: unknown): boolean {
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
  public static isValidServiceFee(
    params: unknown,
  ): asserts params is ServiceFee {
    const parameter = params as ServiceFee;

    // Check if serviceFee.percentageCut is valid
    HederaUtils.checkValidNumber(parameter, 'params', 'percentageCut', true);

    // Check if serviceFee.toAddress is valid
    HederaUtils.checkValidString(parameter, 'params', 'toAddress', false);
  }

  /**
   * Check Validation of signMessage request.
   *
   * @param params - Request params.
   */
  public static isValidSignMessageRequest(
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
    HederaUtils.checkValidString(parameter, 'signMessage', 'header', false);

    // Check if message is valid
    HederaUtils.checkValidString(parameter, 'signMessage', 'message', false);
  }

  /**
   * Check Validation of getAccountInfo request.
   *
   * @param params - Request params.
   */
  public static isValidGetAccountInfoRequest(
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
      HederaUtils.isValidServiceFee(parameter.serviceFee);
    }

    // Check if fetchUsingMirrorNode is valid
    HederaUtils.checkValidBoolean(
      parameter,
      'getAccountInfo',
      'fetchUsingMirrorNode',
      false,
    );
  }

  /**
   * Check Validation of getTransactions request.
   *
   * @param params - Request params.
   */

  public static isValidGetTransactionsParams(
    params: unknown,
  ): asserts params is GetTransactionsRequestParams {
    const parameter = params as GetTransactionsRequestParams;

    // Check if transactionId is valid
    HederaUtils.checkValidString(
      parameter,
      'getTransactions',
      'transactionId',
      false,
    );
  }

  /**
   * Check Validation of transferCrypto request.
   *
   * @param params - Request params.
   */
  public static isValidTransferCryptoParams(
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
    HederaUtils.checkValidString(parameter, 'transferCrypto', 'memo', false);

    // Check if maxFee is valid
    HederaUtils.checkValidNumber(parameter, 'transferCrypto', 'maxFee', false);

    // Check if serviceFee is valid
    if (
      'serviceFee' in parameter &&
      !_.isNull(parameter.serviceFee) &&
      parameter.serviceFee !== undefined
    ) {
      HederaUtils.isValidServiceFee(parameter.serviceFee);
    }

    // Check if transfers is valid
    if ('transfers' in parameter) {
      if (
        _.isEmpty(parameter.transfers) ||
        !Array.isArray(parameter.transfers)
      ) {
        console.error(
          'Invalid transferCrypto Params passed. "transfers" must be passed as an array',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid transferCrypto Params passed. "transfers" must be passed as an array',
        );
      }
      parameter.transfers.forEach((transfer: SimpleTransfer) => {
        // Check if assetType is valid
        HederaUtils.checkValidString(
          transfer,
          'createToken',
          'assetType',
          true,
        );
        if (
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
        HederaUtils.checkValidString(transfer, 'transfers[].to', 'to', true);

        // Check if amount is valid
        HederaUtils.checkValidNumber(
          transfer,
          'transfers[].amount',
          'amount',
          true,
        );

        // Check if assetId is valid
        if (transfer.assetType !== 'HBAR') {
          HederaUtils.checkValidString(
            transfer,
            'transfers[].to',
            'assetId',
            true,
          );
        }
        // Check if assetId is valid for NFT
        // Regular expression to match the "substring/substring" format
        const regex = /^[^\s/]+\/[^\s/]+$/u;
        if (
          transfer.assetType === 'NFT' &&
          !regex.test(transfer.assetId as string)
        ) {
          console.error(
            'Invalid transferCrypto Params passed. "transfers[].assetId" must be in the format "tokenId/serialNumber"',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid transferCrypto Params passed. "transfers[].assetId" must be in the format "tokenId/serialNumber"',
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
  public static isValidStakeHbarParams(
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
    HederaUtils.checkValidNumber(parameter, 'stakeHbar', 'nodeId', false);

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
  public static isValidDeleteAccountParams(
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
  public static isValidApproveAllowanceParams(
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
    HederaUtils.checkValidNumber(parameter, 'approveAllowance', 'amount', true);

    // Check if assetType is valid
    HederaUtils.checkValidString(
      parameter,
      'approveAllowance',
      'assetType',
      true,
    );
    if (
      !(
        parameter.assetType === 'HBAR' ||
        parameter.assetType === 'TOKEN' ||
        parameter.assetType === 'NFT'
      )
    ) {
      console.error(
        'Invalid approveAllowance Params passed. "assetType" must be of the following: "HBAR", "TOKEN", "NFT"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid approveAllowance Params passed. "assetType" must be of the following: "HBAR", "TOKEN", "NFT"',
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

    // Check if assetDetail is valid
    if ('assetDetail' in parameter) {
      if (_.isEmpty(parameter.assetDetail)) {
        console.error(
          'Invalid approveAllowance Params passed. "assetDetail" is not valid',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid approveAllowance Params passed. "assetDetail" is not valid',
        );
      }
      // Check if assetId is valid
      HederaUtils.checkValidString(
        parameter.assetDetail,
        'approveAllowance',
        'assetId',
        true,
      );
      // Check if assetDecimals is valid
      HederaUtils.checkValidNumber(
        parameter,
        'approveAllowance',
        'assetDecimals',
        false,
      );
      // Check if all is valid
      HederaUtils.checkValidBoolean(
        parameter.assetDetail,
        'approveAllowance',
        'all',
        false,
      );
    }
  }

  /**
   * Check Validation of deleteAllowance request.
   *
   * @param params - Request params.
   */
  public static isValidDeleteAllowanceParams(
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
    HederaUtils.checkValidString(
      parameter,
      'deleteAllowance',
      'assetType',
      true,
    );
    if (
      !(
        parameter.assetType === 'HBAR' ||
        parameter.assetType === 'TOKEN' ||
        parameter.assetType === 'NFT'
      )
    ) {
      console.error(
        'Invalid deleteAllowance Params passed. "assetType" must be of the following: "HBAR", "TOKEN", "NFT"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid deleteAllowance Params passed. "assetType" must be of the following: "HBAR", "TOKEN", "NFT"',
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
    if (parameter.assetType === 'TOKEN' || parameter.assetType === 'NFT') {
      HederaUtils.checkValidString(
        parameter,
        'deleteAllowance',
        'assetId',
        true,
      );
    }
  }

  /**
   * Check Validation of createToken request.
   *
   * @param params - Request params.
   */
  public static isValidCreateTokenParams(
    params: unknown,
  ): asserts params is CreateTokenRequestParams {
    if (
      params === null ||
      _.isEmpty(params) ||
      !('assetType' in params) ||
      !('name' in params) ||
      !('symbol' in params) ||
      !('decimals' in params) ||
      !('supplyType' in params)
    ) {
      console.error(
        'Invalid createToken Params passed. "assetType", "name", "symbol", "decimals" and "supplyType" must be passed as parameters',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "assetType", "name", "symbol", "decimals" and "supplyType" must be passed as parameters',
      );
    }

    const parameter = params as CreateTokenRequestParams;

    // Check if assetType is valid
    HederaUtils.checkValidString(parameter, 'createToken', 'assetType', true);
    if (!(parameter.assetType === 'TOKEN' || parameter.assetType === 'NFT')) {
      console.error(
        'Invalid createToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
    }

    // Check if name is valid
    HederaUtils.checkValidString(parameter, 'createToken', 'name', true);
    if (parameter.name.length > 100) {
      console.error(
        'Invalid createToken Params passed. "name" must not be greater than 100 characters',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "name" must not be greater than 100 characters',
      );
    }

    // Check if symbol is valid
    HederaUtils.checkValidString(parameter, 'createToken', 'symbol', true);
    if (parameter.symbol.length > 100) {
      console.error(
        'Invalid createToken Params passed. "symbol" must not be greater than 100 characters',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "symbol" must not be greater than 100 characters',
      );
    }

    // Check if decimals is valid
    HederaUtils.checkValidNumber(parameter, 'createToken', 'decimals', true);
    if (parameter.assetType === 'NFT' && parameter.decimals !== 0) {
      console.error(
        'Invalid createToken Params passed. "decimals" must be 0 for "NFT" assetType',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "decimals" must be 0 for "NFT" assetType',
      );
    }

    // Check if initialSupply is valid
    HederaUtils.checkValidNumber(
      parameter,
      'createToken',
      'initialSupply',
      false,
    );
    if (parameter.assetType === 'NFT' && parameter.initialSupply !== 0) {
      console.error(
        'Invalid createToken Params passed. "initialSupply" must be 0 for "NFT" assetType',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "initialSupply" must be 0 for "NFT" assetType',
      );
    }

    // Check if kycPublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'kycPublicKey',
      false,
    );

    // Check if freezePublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'freezePublicKey',
      false,
    );

    // Check if pausePublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'pausePublicKey',
      false,
    );

    // Check if wipePublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'wipePublicKey',
      false,
    );

    // Check if supplyPublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'supplyPublicKey',
      false,
    );
    if (parameter.assetType === 'NFT' && _.isEmpty(parameter.supplyPublicKey)) {
      console.error(
        'Invalid createToken Params passed. "supplyPublicKey" must be passed for "NFT" assetType',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "supplyPublicKey" must be passed for "NFT" assetType',
      );
    }

    // Check if feeSchedulePublicKey is valid
    HederaUtils.checkValidPublicKey(
      parameter,
      'createToken',
      'feeSchedulePublicKey',
      false,
    );

    // Check if freezeDefault is valid
    HederaUtils.checkValidBoolean(
      parameter,
      'createToken',
      'freezeDefault',
      false,
    );

    // Check if expirationTime is valid
    HederaUtils.checkValidTimestamp(
      parameter,
      'createToken',
      'expirationTime',
      false,
    );

    // Check if autoRenewAccountId is valid
    HederaUtils.checkValidString(
      parameter,
      'createToken',
      'autoRenewAccountId',
      false,
    );

    // Check if tokenMemo is valid
    HederaUtils.checkValidString(parameter, 'createToken', 'tokenMemo', false);

    // Check if customFees is valid
    if ('customFees' in parameter) {
      if (
        _.isEmpty(parameter.customFees) ||
        !Array.isArray(parameter.customFees)
      ) {
        console.error(
          'Invalid createToken Params passed. "customFees" must be passed as an array',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid createToken Params passed. "customFees" must be passed as an array',
        );
      }
      parameter.customFees.forEach((customFee: TokenCustomFee) => {
        // Check if feeCollectorAccountId is valid
        HederaUtils.checkValidString(
          customFee,
          'createToken',
          'feeCollectorAccountId',
          true,
        );
        // Check if hbarAmount is valid
        HederaUtils.checkValidNumber(
          customFee,
          'createToken',
          'hbarAmount',
          false,
        );
        // Check if tokenAmount is valid
        HederaUtils.checkValidNumber(
          customFee,
          'createToken',
          'tokenAmount',
          false,
        );
        // Check if denominatingTokenId is valid
        HederaUtils.checkValidString(
          customFee,
          'createToken',
          'denominatingTokenId',
          false,
        );
        // Check if allCollectorsAreExempt is valid
        HederaUtils.checkValidBoolean(
          customFee,
          'createToken',
          'allCollectorsAreExempt',
          false,
        );
      });
    }

    // Check if supplyType is valid
    HederaUtils.checkValidString(parameter, 'createToken', 'supplyType', true);
    if (
      !(
        parameter.supplyType === 'FINITE' || parameter.supplyType === 'INFINITE'
      )
    ) {
      console.error(
        'Invalid createToken Params passed. "supplyType" must be of the following: "FINITE", "INFINITE"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "supplyType" must be of the following: "FINITE", "INFINITE"',
      );
    }

    // Check if maxSupply is valid
    HederaUtils.checkValidNumber(parameter, 'createToken', 'maxSupply', false);
    if (parameter.maxSupply && parameter.supplyType === 'INFINITE') {
      console.error(
        'Invalid createToken Params passed. "maxSupply" cannot be passed for "INFINITE" supplyType',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid createToken Params passed. "maxSupply" cannot be passed for "INFINITE" supplyType',
      );
    }
  }

  /**
   * Check Validation of mintToken request.
   *
   * @param params - Request params.
   */
  public static isValidMintTokenParams(
    params: unknown,
  ): asserts params is MintTokenRequestParams {
    if (
      params === null ||
      _.isEmpty(params) ||
      !('assetType' in params) ||
      !('tokenId' in params)
    ) {
      console.error(
        'Invalid mintToken Params passed. "assetType", and "tokenId" must be passed as parameters',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid mintToken Params passed. "assetType", and "tokenId" must be passed as parameters',
      );
    }

    const parameter = params as MintTokenRequestParams;

    // Check if assetType is valid
    HederaUtils.checkValidString(parameter, 'mintToken', 'assetType', true);
    if (!(parameter.assetType === 'TOKEN' || parameter.assetType === 'NFT')) {
      console.error(
        'Invalid mintToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid mintToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
    }

    // Check if tokenId is valid
    HederaUtils.checkValidString(parameter, 'mintToken', 'tokenId', true);

    // Check for NFT assetType
    if (parameter.assetType === 'NFT') {
      if ('amount' in parameter) {
        console.error(
          'Invalid mintToken Params passed. "amount" can only be passed to fungible tokens',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid mintToken Params passed. "amount" can only be passed to fungible tokens',
        );
      }
      // Check if metadata is valid
      if ('metadata' in parameter) {
        if (
          _.isEmpty(parameter.metadata) ||
          !Array.isArray(parameter.metadata)
        ) {
          console.error(
            'Invalid mintToken Params passed. "tokenIds" must be passed as an array of strings',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid mintToken Params passed. "tokenIds" must be passed as an array of strings',
          );
        }
        parameter.metadata.forEach((metadata: string) => {
          if (_.isEmpty(metadata) || typeof metadata !== 'string') {
            console.error(
              'Invalid mintToken Params passed. "metadata" must be passed as an array of strings',
            );
            throw providerErrors.unsupportedMethod(
              'Invalid mintToken Params passed. "metadata" must be passed as an array of strings',
            );
          }
        });
      } else {
        console.error(
          'Invalid mintToken Params passed. "metadata" must be passed for NFTs',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid mintToken Params passed. "metadata" must be passed for NFTs',
        );
      }
    } else {
      HederaUtils.checkValidNumber(parameter, 'mintToken', 'amount', true);
      if (parameter.amount === 0) {
        console.error(
          'Invalid mintToken Params passed. "amount" must be greater than 0',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid mintToken Params passed. "amount" must be greater than 0',
        );
      }
      if ('metadata' in parameter) {
        console.error(
          'Invalid mintToken Params passed. "metadata" can only be passed to NFTs',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid mintToken Params passed. "metadata" can only be passed to NFTs',
        );
      }
    }
  }

  /**
   * Check Validation of burnToken request.
   *
   * @param params - Request params.
   */
  public static isValidBurnTokenParams(
    params: unknown,
  ): asserts params is BurnTokenRequestParams {
    if (
      params === null ||
      _.isEmpty(params) ||
      !('assetType' in params) ||
      !('tokenId' in params)
    ) {
      console.error(
        'Invalid burnToken Params passed. "assetType", and "tokenId" must be passed as parameters',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid burnToken Params passed. "assetType", and "tokenId" must be passed as parameters',
      );
    }

    const parameter = params as BurnTokenRequestParams;

    // Check if assetType is valid
    HederaUtils.checkValidString(parameter, 'burnToken', 'assetType', true);
    if (!(parameter.assetType === 'TOKEN' || parameter.assetType === 'NFT')) {
      console.error(
        'Invalid burnToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid burnToken Params passed. "assetType" must be of the following: "TOKEN", "NFT"',
      );
    }

    // Check if tokenId is valid
    HederaUtils.checkValidString(parameter, 'burnToken', 'tokenId', true);

    // Check for NFT assetType
    if (parameter.assetType === 'NFT') {
      if ('amount' in parameter) {
        console.error(
          'Invalid burnToken Params passed. "amount" can only be passed to fungible tokens',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid burnToken Params passed. "amount" can only be passed to fungible tokens',
        );
      }
      // Check if serialNumbers is valid
      if ('serialNumbers' in parameter) {
        if (
          _.isEmpty(parameter.serialNumbers) ||
          !Array.isArray(parameter.serialNumbers)
        ) {
          console.error(
            'Invalid burnToken Params passed. "serialNumbers" must be passed as an array of numbers',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid burnToken Params passed. "serialNumbers" must be passed as an array of numbers',
          );
        }
        parameter.serialNumbers.forEach((serialNumber: number) => {
          if (typeof serialNumber !== 'number' || serialNumber < 0) {
            console.error(
              'Invalid burnToken Params passed. "serialNumbers" must be passed as an array of numbers',
            );
            throw providerErrors.unsupportedMethod(
              'Invalid burnToken Params passed. "serialNumbers" must be passed as an array of numbers',
            );
          }
        });
      } else {
        console.error(
          'Invalid burnToken Params passed. "serialNumbers" must be passed for NFTs',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid burnToken Params passed. "serialNumbers" must be passed for NFTs',
        );
      }
    } else {
      HederaUtils.checkValidNumber(parameter, 'burnToken', 'amount', true);
      if (parameter.amount === 0) {
        console.error(
          'Invalid burnToken Params passed. "amount" must be greater than 0',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid burnToken Params passed. "amount" must be greater than 0',
        );
      }
      if ('serialNumbers' in parameter) {
        console.error(
          'Invalid burnToken Params passed. "serialNumbers" can only be passed to NFTs',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid burnToken Params passed. "serialNumbers" can only be passed to NFTs',
        );
      }
    }
  }

  /**
   * Check Validation of associateTokens request.
   *
   * @param params - Request params.
   */
  public static isValidAssociateTokensParams(
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
    if ('tokenIds' in parameter) {
      if (_.isEmpty(parameter.tokenIds) || !Array.isArray(parameter.tokenIds)) {
        console.error(
          'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
        );
      }
      parameter.tokenIds.forEach((tokenId: string) => {
        if (_.isEmpty(tokenId) || typeof tokenId !== 'string') {
          console.error(
            'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid associateTokens Params passed. "tokenIds" must be passed as an array of strings',
          );
        }
      });
    }
  }

  /**
   * Check Validation of dissociateTokens request.
   *
   * @param params - Request params.
   */
  public static isValidDissociateTokensParams(
    params: unknown,
  ): asserts params is DissociateTokensRequestParams {
    if (params === null || _.isEmpty(params) || !('tokenIds' in params)) {
      console.error(
        'Invalid dissociateTokens Params passed. "tokenIds" must be passed as a parameter',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid dissociateTokens Params passed. "tokenIds" must be passed as a parameter',
      );
    }

    const parameter = params as DissociateTokensRequestParams;

    // Check if tokenIds is valid
    if ('tokenIds' in parameter) {
      if (_.isEmpty(parameter.tokenIds) || !Array.isArray(parameter.tokenIds)) {
        console.error(
          'Invalid dissociateTokens Params passed. "tokenIds" must be passed as an array of strings',
        );
        throw providerErrors.unsupportedMethod(
          'Invalid dissociateTokens Params passed. "tokenIds" must be passed as an array of strings',
        );
      }
      parameter.tokenIds.forEach((tokenId: string) => {
        if (_.isEmpty(tokenId) || typeof tokenId !== 'string') {
          console.error(
            'Invalid dissociateTokens Params passed. "tokenIds" must be passed as an array of strings',
          );
          throw providerErrors.unsupportedMethod(
            'Invalid dissociateTokens Params passed. "tokenIds" must be passed as an array of strings',
          );
        }
      });
    }
  }

  /**
   * Check Validation of deleteToken request.
   *
   * @param params - Request params.
   */
  public static isValidDeleteTokenParams(
    params: unknown,
  ): asserts params is DeleteTokenRequestParams {
    if (params === null || _.isEmpty(params) || !('tokenId' in params)) {
      console.error(
        'Invalid deleteToken Params passed. "tokenId" must be passed as a parameter',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid deleteToken Params passed. "tokenId" must be passed as a parameter',
      );
    }

    const parameter = params as DeleteTokenRequestParams;

    if (_.isEmpty(parameter.tokenId) || typeof parameter.tokenId !== 'string') {
      console.error(
        'Invalid deleteToken Params passed. "tokenId" must be a string.',
      );
      throw providerErrors.unsupportedMethod(
        'Invalid deleteToken Params passed. "tokenId" must be a string.',
      );
    }
  }

  public static validHederaNetwork(network: string) {
    return isIn(hederaNetworks, network);
  }

  public static async getMirrorTransactions(
    accountId: string,
    transactionId: string,
    mirrorNodeUrl: string,
  ): Promise<MirrorTransactionInfo[]> {
    let result = [] as MirrorTransactionInfo[];
    let url = `${mirrorNodeUrl}/api/v1/transactions/`;
    if (_.isEmpty(transactionId)) {
      url = `${url}?account.id=${accountId}&limit=50&order=desc`;
    } else {
      url = `${url}${transactionId}`;
    }

    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    try {
      result = response.data.transactions as MirrorTransactionInfo[];

      result.forEach((transaction) => {
        transaction.consensus_timestamp = Utils.timestampToString(
          transaction.consensus_timestamp,
        );
        transaction.parent_consensus_timestamp = Utils.timestampToString(
          transaction.parent_consensus_timestamp,
        );
        transaction.valid_start_timestamp = Utils.timestampToString(
          transaction.valid_start_timestamp,
        );
      });
    } catch (error: any) {
      console.error('Error in getMirrorTransactions:', String(error));
    }

    return result;
  }

  public static async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
    mirrorNodeUrl: string,
  ): Promise<AccountInfo> {
    const result = {} as AccountInfo;
    const url = `${mirrorNodeUrl}/api/v1/accounts/${idOrAliasOrEvmAddress}`;
    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    const mirrorNodeData = response.data as MirrorAccountInfo;

    try {
      result.accountId = mirrorNodeData.account;
      result.alias = mirrorNodeData.alias;
      result.createdTime = Utils.timestampToString(
        mirrorNodeData.created_timestamp,
      );
      result.expirationTime = Utils.timestampToString(
        mirrorNodeData.expiry_timestamp,
      );
      result.memo = mirrorNodeData.memo;
      result.evmAddress = mirrorNodeData.evm_address;
      result.key = {
        type: mirrorNodeData.key._type,
        key: mirrorNodeData.key.key,
      };
      result.autoRenewPeriod = String(mirrorNodeData.auto_renew_period);
      result.ethereumNonce = String(mirrorNodeData.ethereum_nonce);
      result.isDeleted = mirrorNodeData.deleted;
      result.stakingInfo = {
        declineStakingReward: mirrorNodeData.decline_reward,
        stakePeriodStart: Utils.timestampToString(
          mirrorNodeData.stake_period_start,
        ),
        pendingReward: String(mirrorNodeData.pending_reward),
        stakedToMe: '0', // TODO
        stakedAccountId: mirrorNodeData.staked_account_id ?? '',
        stakedNodeId: mirrorNodeData.staked_node_id ?? '',
      } as StakingInfoJson;

      const hbars = mirrorNodeData.balance.balance / 1e8;
      const tokens: Record<string, TokenBalance> = {};
      // Use map to create an array of promises
      const tokenPromises = mirrorNodeData.balance.tokens.map(
        async (token: Token) => {
          const tokenId = token.token_id;
          const tokenInfo: MirrorTokenInfo = await CryptoUtils.getTokenById(
            tokenId,
            mirrorNodeUrl,
          );
          if (tokenInfo.type === 'NON_FUNGIBLE_UNIQUE') {
            const nfts: MirrorNftInfo[] = await CryptoUtils.GetNftSerialNumber(
              tokenId,
              result.accountId,
              mirrorNodeUrl,
            );
            nfts.forEach((nftInfo) => {
              const nftId = new NftId(
                TokenId.fromString(tokenId),
                Number(nftInfo.serial_number),
              );
              tokens[nftId.toString()] = {
                balance: 1,
                decimals: 0,
                tokenId,
                nftSerialNumber: nftInfo.serial_number,
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                tokenType: tokenInfo.type,
                supplyType: tokenInfo.supply_type,
                totalSupply: (
                  Number(tokenInfo.total_supply) /
                  Math.pow(10, Number(tokenInfo.decimals))
                ).toString(),
                maxSupply: (
                  Number(tokenInfo.max_supply) /
                  Math.pow(10, Number(tokenInfo.decimals))
                ).toString(),
              } as TokenBalance;
            });
          } else {
            tokens[tokenId] = {
              balance: token.balance / Math.pow(10, Number(tokenInfo.decimals)),
              decimals: Number(tokenInfo.decimals),
              tokenId,
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              tokenType: tokenInfo.type,
              supplyType: tokenInfo.supply_type,
              totalSupply: (
                Number(tokenInfo.total_supply) /
                Math.pow(10, Number(tokenInfo.decimals))
              ).toString(),
              maxSupply: (
                Number(tokenInfo.max_supply) /
                Math.pow(10, Number(tokenInfo.decimals))
              ).toString(),
            } as TokenBalance;
          }
        },
      );

      // Wait for all promises to resolve
      await Promise.all(tokenPromises);

      result.balance = {
        hbars,
        timestamp: Utils.timestampToString(mirrorNodeData.balance.timestamp),
        tokens,
      } as AccountBalance;
    } catch (error: any) {
      console.error('Error in getMirrorAccountInfo:', String(error));
    }

    return result;
  }

  public static async getNodeStakingInfo(
    mirrorNodeUrl: string,
    nodeId?: number,
  ): Promise<MirrorStakingInfo[]> {
    const result: MirrorStakingInfo[] = [];

    let url = `${mirrorNodeUrl}/api/v1/network/nodes`;

    if (_.isNull(nodeId)) {
      url = `${url}?order=desc&limit=50`;
    } else {
      url = `${url}?node.id=${nodeId as number}`;
    }

    const response: FetchResponse = await FetchUtils.fetchDataFromUrl(url);
    if (!response.success) {
      return result;
    }

    try {
      for (const node of response.data.nodes) {
        result.push(node);
      }

      if (response.data.links.next) {
        const secondUrl = `${mirrorNodeUrl}${
          response.data.links.next as string
        }`;
        const secondResponse: FetchResponse = await FetchUtils.fetchDataFromUrl(
          secondUrl,
        );
        if (secondResponse.success) {
          for (const node of secondResponse.data.nodes) {
            result.push(node);
          }
        }
      }
    } catch (error: any) {
      console.error('Error in getNodeStakingInfo:', String(error));
    }

    return result;
  }
}
