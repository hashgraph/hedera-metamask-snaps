/*-
 *
 * Hedera Identify Snap
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

import { AccountId } from '@hashgraph/sdk';
import { rpcErrors } from '@metamask/rpc-errors';
import { ethers } from 'ethers';
import _ from 'lodash';
import { ECDSA_SECP256K1_KEY_TYPE, ED25519_KEY_TYPE } from '../constants';
import {
  IDataManagerClearArgs,
  IDataManagerDeleteArgs,
  IDataManagerQueryArgs,
  IDataManagerSaveArgs,
} from '../plugins/veramo/verifiable-creds-manager';
import { ExternalAccount } from '../types/account';
import {
  availableProofFormats,
  availableVCStores,
  isValidProofFormat,
  isValidVCStore,
} from '../types/constants';
import {
  CreateVCRequestParams,
  CreateVPRequestParams,
  GoogleToken,
  ResolveDIDRequestParams,
  SwitchMethodRequestParams,
  VerifyVCRequestParams,
  VerifyVPRequestParams,
} from '../types/params';
import { CryptoUtils } from './CryptoUtils';

export class ParamUtils {
  /**
   * Checks if the specified property in the given object is passed.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkRequiredProperty(
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
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be passed`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid string.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidString(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
    // Check if the property exists and is a valid string
    if (
      propertyName in parameter &&
      (typeof parameter[propertyName] !== 'string' ||
        _.isEmpty(parameter[propertyName]))
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string`,
      );
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid Hedera AccountId.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidAccountId(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
    // Check if the property exists and is a valid Hedera AccountId
    if (
      propertyName in parameter &&
      (typeof parameter[propertyName] !== 'string' ||
        _.isEmpty(parameter[propertyName]) ||
        !AccountId.fromString(parameter[propertyName]))
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string and a valid Hedera Account Id`,
      );
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a string and a valid Hedera Account Id`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid boolean.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidBoolean(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
    // Check if the property exists and is a valid boolean
    if (
      propertyName in parameter &&
      typeof parameter[propertyName] !== 'boolean'
    ) {
      console.error(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a boolean`,
      );
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a boolean`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid number.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidNumber(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
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
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a number`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid timestamp.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidTimestamp(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
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
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a valid date string in the format YYYY-MM-DD or date-time string in the format YYYY-MM-DDTHH:mm:ss`,
      );
    }
  }

  /**
   * Checks if the specified property in the given object is a valid public key.
   * @param parameter - The object containing the property to check.
   * @param methodName - The method name.
   * @param propertyName - The name of the property to validate.
   * @param isRequired - Whether to check if this property is required to be present.
   */
  // eslint-disable-next-line no-restricted-syntax
  static checkValidPublicKey(
    parameter: any,
    methodName: string,
    propertyName: string,
    isRequired: boolean,
  ) {
    // Check if the property exists if isRequired is true
    this.checkRequiredProperty(parameter, methodName, propertyName, isRequired);
    // Check if the property exists and is a valid string first
    this.checkValidString(parameter, methodName, propertyName, isRequired);
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
      throw rpcErrors.invalidParams(
        `Invalid ${methodName} Params passed. "${propertyName}" must be a public key`,
      );
    }
  }

  /**
   * Check whether the account was imported using private key(external account).
   * @param params - Request params.
   * @returns Whether to treat it as an external account that was imported using private key.
   */

  static isExternalAccountFlagSet(params: unknown): boolean {
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
            throw rpcErrors.invalidParams(
              'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
            );
          }

          const evmAddress = parameter.externalAccount.accountIdOrEvmAddress;

          if (ethers.isAddress(evmAddress)) {
            // Ensure the curve is set to ECDSA_SECP256K1 for Ethereum addresses
            if (
              !(
                'curve' in parameter.externalAccount &&
                parameter.externalAccount.curve === ECDSA_SECP256K1_KEY_TYPE
              )
            ) {
              console.error(
                `Invalid externalAccount Params passed. If "accountIdOrEvmAddress" is an Ethereum address, the "curve" must be set to "${ECDSA_SECP256K1_KEY_TYPE}".`,
              );
              throw rpcErrors.invalidParams(
                `Invalid externalAccount Params passed. If "accountIdOrEvmAddress" is an Ethereum address, the "curve" must be set to "${ECDSA_SECP256K1_KEY_TYPE}".`,
              );
            }
          }

          if (
            'curve' in parameter.externalAccount &&
            parameter.externalAccount.curve !== null
          ) {
            if (
              typeof parameter.externalAccount.curve !== 'string' ||
              (parameter.externalAccount.curve !== ECDSA_SECP256K1_KEY_TYPE &&
                parameter.externalAccount.curve !== ED25519_KEY_TYPE)
            ) {
              console.error(
                `Invalid externalAccount Params passed. "curve" must be a string and must be either "${ECDSA_SECP256K1_KEY_TYPE}" or "${ED25519_KEY_TYPE}"`,
              );
              throw rpcErrors.invalidParams(
                `Invalid externalAccount Params passed. "curve" must be a string and must be either "${ECDSA_SECP256K1_KEY_TYPE}" or "${ED25519_KEY_TYPE}"`,
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
   * Check Validation of Switch Method request.
   *
   * @param params - Request params.
   */
  static isValidSwitchMethodRequest(
    params: unknown,
  ): asserts params is SwitchMethodRequestParams {
    if (params === null || _.isEmpty(params) || !('didMethod' in params)) {
      console.error(
        'Invalid switchMethod Params passed. "didMethod" must be passed as a parameter',
      );
      throw rpcErrors.invalidParams(
        'Invalid switchMethod Params passed. "didMethod" must be passed as a parameter',
      );
    }
    const parameter = params as SwitchMethodRequestParams;

    ParamUtils.checkValidString(parameter, 'switchMethod', 'didMethod', true);
  }

  /**
   * Check Validation of Resolve DID request.
   *
   * @param params - Request params.
   */
  static isValidResolveDIDRequest(
    params: unknown,
  ): asserts params is ResolveDIDRequestParams {
    const parameter = params as ResolveDIDRequestParams;

    ParamUtils.checkValidString(parameter, 'resolveDID', 'did', false);
  }

  /**
   * Check Validation of Get VCs request.
   *
   * @param params - Request params.
   */
  static isValidGetVCsRequest(
    params: unknown,
  ): asserts params is IDataManagerQueryArgs {
    const parameter = params as IDataManagerQueryArgs;

    // Check if filter is valid
    if ('filter' in parameter) {
      ParamUtils.checkValidString(parameter.filter, 'getVCs', 'type', true);
      ParamUtils.checkRequiredProperty(
        parameter.filter,
        'getVCs',
        'filter',
        true,
      );
    }

    // Check if options is valid
    if (
      'options' in parameter &&
      parameter.options !== null &&
      typeof parameter.options === 'object'
    ) {
      if ('store' in parameter.options && parameter.options?.store !== null) {
        if (typeof parameter.options?.store === 'string') {
          if (!isValidVCStore(parameter.options?.store)) {
            console.error(
              `Invalid getVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
            throw new Error(
              `Invalid getVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
          }
        } else if (
          Array.isArray(parameter.options?.store) &&
          parameter.options?.store.length > 0
        ) {
          (parameter.options?.store as [string]).forEach((store) => {
            if (!isValidVCStore(store)) {
              console.error(
                `Invalid getVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid getVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          });
        } else {
          console.error(
            'Invalid getVCs Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
          throw new Error(
            'Invalid getVCs Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
        }
      }
    }

    ParamUtils.checkValidBoolean(
      parameter.options,
      'getVCs',
      'returnStore',
      false,
    );

    // Check if accessToken is valid
    ParamUtils.checkValidString(parameter, 'getVCs', 'accessToken', false);
  }

  /**
   * Check Validation of Save VC request.
   *
   * @param params - Request params.
   */
  static isValidSaveVCRequest(
    params: unknown,
  ): asserts params is IDataManagerSaveArgs {
    if (params === null || _.isEmpty(params) || !('data' in params)) {
      console.error(
        'Invalid saveVC Params passed. "data" must be passed as a parameter',
      );
      throw new Error(
        'Invalid saveVC Params passed. "data" must be passed as a parameter',
      );
    }

    const parameter = params as IDataManagerSaveArgs;

    ParamUtils.checkRequiredProperty(parameter, 'saveVC', 'data', true);

    // Check if options is valid
    if (
      'options' in parameter &&
      parameter.options !== null &&
      typeof parameter.options === 'object'
    ) {
      if ('store' in parameter.options && parameter.options?.store !== null) {
        if (typeof parameter.options?.store === 'string') {
          if (!isValidVCStore(parameter.options?.store)) {
            console.error(
              `Invalid saveVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
            throw new Error(
              `Invalid saveVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
          }
        } else if (
          Array.isArray(parameter.options?.store) &&
          parameter.options?.store.length > 0
        ) {
          (parameter.options?.store as [string]).forEach((store) => {
            if (!isValidVCStore(store)) {
              console.error(
                `Invalid saveVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid saveVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          });
        } else {
          console.error(
            'Invalid saveVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
          throw new Error(
            'Invalid saveVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
        }
      }
    }

    // Check if accessToken is valid
    ParamUtils.checkValidString(parameter, 'saveVC', 'accessToken', false);
  }

  /**
   * Check Validation of Create VC request.
   *
   * @param params - Request params.
   */
  static isValidCreateVCRequest(
    params: unknown,
  ): asserts params is CreateVCRequestParams {
    if (params === null || _.isEmpty(params) || !('vcValue' in params)) {
      console.error(
        'Invalid createVC Params passed. "vcValue" must be passed as a parameter',
      );
      throw new Error(
        'Invalid createVC Params passed. "vcValue" must be passed as a parameter',
      );
    }

    const parameter = params as CreateVCRequestParams;

    ParamUtils.checkRequiredProperty(parameter, 'createVC', 'vcValue', true);
    ParamUtils.checkValidString(parameter, 'createVC', 'vcKey', false);

    // Check if credTypes is valid
    if ('credTypes' in parameter) {
      if (
        !(
          parameter.credTypes !== null &&
          Array.isArray(parameter.credTypes) &&
          parameter.credTypes.length > 0
        )
      ) {
        console.error(
          'Invalid createVC Params passed. "credTypes" is not in a valid format. It must be an array of strings',
        );
        throw new Error(
          'Invalid createVC Params passed. "credTypes" is not in a valid format. It must be an array of strings',
        );
      }
    }

    // Check if options is valid
    if (
      'options' in parameter &&
      parameter.options !== null &&
      typeof parameter.options === 'object'
    ) {
      if ('store' in parameter.options && parameter.options?.store !== null) {
        if (typeof parameter.options?.store === 'string') {
          if (!isValidVCStore(parameter.options?.store)) {
            console.error(
              `Invalid createVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
            throw new Error(
              `Invalid createVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
          }
        } else if (
          Array.isArray(parameter.options?.store) &&
          parameter.options?.store.length > 0
        ) {
          (parameter.options?.store as [string]).forEach((store) => {
            if (!isValidVCStore(store)) {
              console.error(
                `Invalid createVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid createVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          });
        } else {
          console.error(
            'Invalid createVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
          throw new Error(
            'Invalid createVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
        }
      }
    }

    // Check if accessToken is valid
    ParamUtils.checkValidString(parameter, 'createVC', 'accessToken', false);
  }

  /**
   * Check Validation of Verify VC request.
   *
   * @param params - Request params.
   */
  static isValidVerifyVCRequest(
    params: unknown,
  ): asserts params is VerifyVCRequestParams {
    if (
      params === null ||
      _.isEmpty(params) ||
      !('verifiableCredential' in params)
    ) {
      console.error(
        'Invalid verifyVC Params passed. "verifiableCredential" must be passed as a parameter',
      );
      throw new Error(
        'Invalid verifyVC Params passed. "verifiableCredential" must be passed as a parameter',
      );
    }

    const parameter = params as VerifyVCRequestParams;

    ParamUtils.checkRequiredProperty(
      parameter,
      'verifyVC',
      'verifiableCredential',
      true,
    );
  }

  /**
   * Check Validation of Remove VC request.
   *
   * @param params - Request params.
   */
  static isValidRemoveVCRequest(
    params: unknown,
  ): asserts params is IDataManagerDeleteArgs {
    if (params === null || _.isEmpty(params) || !('id' in params)) {
      console.error(
        'Invalid removeVC Params passed. "id" must be passed as a parameter',
      );
      throw new Error(
        'Invalid removeVC Params passed. "id" must be passed as a parameter',
      );
    }

    const parameter = params as IDataManagerDeleteArgs;

    ParamUtils.checkValidString(parameter, 'removeVC', 'id', true);
    // Check if id is valid
    if (!Array.isArray(parameter.id) && !(typeof parameter.id === 'string')) {
      console.error(
        'Invalid removeVC Params passed. "id" must be a string or an array of strings',
      );
      throw new Error(
        'Invalid removeVC Params passed. "id" must be a string or an array of strings',
      );
    }

    // Check if options is valid
    if (
      'options' in parameter &&
      parameter.options !== null &&
      typeof parameter.options === 'object'
    ) {
      if ('store' in parameter.options && parameter.options?.store !== null) {
        if (typeof parameter.options?.store === 'string') {
          if (!isValidVCStore(parameter.options?.store)) {
            console.error(
              `Invalid removeVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
            throw new Error(
              `Invalid removeVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
          }
        } else if (
          Array.isArray(parameter.options?.store) &&
          parameter.options?.store.length > 0
        ) {
          (parameter.options?.store as [string]).forEach((store) => {
            if (!isValidVCStore(store)) {
              console.error(
                `Invalid removeVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid removeVC Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          });
        } else {
          console.error(
            'Invalid removeVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
          throw new Error(
            'Invalid removeVC Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
        }
      }
    }

    // Check if accessToken is valid
    ParamUtils.checkValidString(parameter, 'removeVC', 'accessToken', false);
  }

  /**
   * Check Validation of Delete all VCs request.
   *
   * @param params - Request params.
   */
  static isValidDeleteAllVCsRequest(
    params: unknown,
  ): asserts params is IDataManagerClearArgs {
    const parameter = params as IDataManagerClearArgs;

    // Check if filter is valid
    if ('filter' in parameter) {
      ParamUtils.checkValidString(
        parameter.filter,
        'deleteAllVCs',
        'type',
        true,
      );
      ParamUtils.checkRequiredProperty(
        parameter.filter,
        'getVCs',
        'filter',
        true,
      );
    }

    // Check if options is valid
    if (
      'options' in parameter &&
      parameter.options !== null &&
      typeof parameter.options === 'object'
    ) {
      if ('store' in parameter.options && parameter.options?.store !== null) {
        if (typeof parameter.options?.store === 'string') {
          if (!isValidVCStore(parameter.options?.store)) {
            console.error(
              `Invalid deleteAllVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
            throw new Error(
              `Invalid deleteAllVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
            );
          }
        } else if (
          Array.isArray(parameter.options?.store) &&
          parameter.options?.store.length > 0
        ) {
          (parameter.options?.store as [string]).forEach((store) => {
            if (!isValidVCStore(store)) {
              console.error(
                `Invalid deleteAllVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid deleteAllVCs Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          });
        } else {
          console.error(
            'Invalid deleteAllVCs Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
          throw new Error(
            'Invalid deleteAllVCs Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
          );
        }
      }
    }

    // Check if accessToken is valid
    ParamUtils.checkValidString(
      parameter,
      'deleteAllVCs',
      'accessToken',
      false,
    );
  }

  /**
   * Check Validation of Create VP request.
   *
   * @param params - Request params.
   */
  static isValidCreateVPRequest(
    params: unknown,
  ): asserts params is CreateVPRequestParams {
    if (params === null || _.isEmpty(params)) {
      console.error(
        'Invalid createVP Params passed. "vcIds" or "vcs" must be passed as a parameter',
      );
      throw new Error(
        'Invalid createVP Params passed. "vcIds" or "vcs" must be passed as a parameter',
      );
    }

    const parameter = params as CreateVPRequestParams;

    // Ensure that either vcIds or vcs is passed
    if (!('vcIds' in parameter || 'vcs' in parameter)) {
      console.error(
        'Invalid createVP Params passed. Either "vcIds" or "vcs" must be passed as parameters',
      );
      throw new Error(
        'Invalid createVP Params passed. Either "vcIds" or "vcs" must be passed as parameters',
      );
    }

    // Check if vcIds is valid
    if (
      'vcIds' in parameter &&
      parameter.vcs !== null &&
      Array.isArray(parameter.vcs)
    ) {
      (parameter.vcIds as [string]).forEach((vcId) => {
        // Check if vcId is valid
        if (!(vcId !== null && typeof vcId === 'string')) {
          console.error(
            `Invalid createVP Params passed. vcId: '${vcId}' is not in a valid format. It must be a string`,
          );
          throw new Error(
            `Invalid createVP Params passed. vcId: '${vcId}' is not in a valid format. It must be a string`,
          );
        }
      });

      // Check if options is valid
      if (
        'options' in parameter &&
        parameter.options !== null &&
        typeof parameter.options === 'object'
      ) {
        if ('store' in parameter.options && parameter.options?.store !== null) {
          if (typeof parameter.options?.store === 'string') {
            if (!isValidVCStore(parameter.options?.store)) {
              console.error(
                `Invalid createVP Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
              throw new Error(
                `Invalid createVP Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
              );
            }
          } else if (
            Array.isArray(parameter.options?.store) &&
            parameter.options?.store.length > 0
          ) {
            (parameter.options?.store as [string]).forEach((store) => {
              if (!isValidVCStore(store)) {
                console.error(
                  `Invalid createVP Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
                );
                throw new Error(
                  `Invalid createVP Params passed. "options.store" is not a valid store. The valid store is one of the following: ${availableVCStores}`,
                );
              }
            });
          } else {
            console.error(
              'Invalid createVP Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
            );
            throw new Error(
              'Invalid createVP Params passed. "options.store" is not in a valid format. It must either be a string or an array of strings',
            );
          }
        }
      }
    }

    // Check if vcs is valid
    if (
      'vcs' in parameter &&
      parameter.vcs !== null &&
      Array.isArray(parameter.vcs)
    ) {
      (parameter.vcs as [string]).forEach((vc) => {
        // Check if vc is valid
        if (!(vc !== null && typeof vc === 'object')) {
          console.error(
            'Invalid createVP Params passed. One of the vcs that was passed is not in a valid format. It must be an object',
          );
          throw new Error(
            'Invalid createVP Params passed. One of the vcs that was passed is not in a valid format. It must be an object',
          );
        }
      });
    }

    // Check if proofInfo is valid
    if (
      'proofInfo' in parameter &&
      parameter.proofInfo !== null &&
      typeof parameter.proofInfo === 'object'
    ) {
      // Check if proofFormat is valid
      if (
        'proofFormat' in parameter.proofInfo &&
        parameter.proofInfo.proofFormat !== null &&
        !isValidProofFormat(parameter.proofInfo.proofFormat as string)
      ) {
        console.error(
          `Invalid createVP Params passed. Proofformat '${parameter.proofInfo.proofFormat}' not supported. The supported proof formats are: ${availableProofFormats}`,
        );
        throw new Error(
          `Invalid createVP Params passed. Proofformat '${parameter.proofInfo.proofFormat}' not supported. The supported proof formats are: ${availableProofFormats}`,
        );
      }

      // Check if type is a string
      if (
        'type' in parameter.proofInfo &&
        parameter.proofInfo.type !== null &&
        typeof parameter.proofInfo.type !== 'string'
      ) {
        console.error(
          'Invalid createVP Params passed. "proofInfo.type" is not in a valid format. It must be a string',
        );
        throw new Error(
          'Invalid createVP Params passed. "proofInfo.type" is not in a valid format. It must be a string',
        );
      }

      // Check if domain is a string
      if (
        'domain' in parameter.proofInfo &&
        parameter.proofInfo.domain !== null &&
        typeof parameter.proofInfo.domain !== 'string'
      ) {
        console.error(
          'Invalid createVP Params passed. "proofInfo.domain" is not in a valid format. It must be a string',
        );
        throw new Error(
          'Invalid createVP Params passed. "proofInfo.domain" is not in a valid format. It must be a string',
        );
      }

      // Check if challenge is a string
      if (
        'challenge' in parameter.proofInfo &&
        parameter.proofInfo.challenge !== null &&
        typeof parameter.proofInfo.challenge !== 'string'
      ) {
        console.error(
          'Invalid createVP Params passed. "proofInfo.challenge" is not in a valid format. It must be a string',
        );
        throw new Error(
          'Invalid createVP Params passed. "proofInfo.challenge" is not in a valid format. It must be a string',
        );
      }
    }
  }

  /**
   * Check Validation of Verify VP request.
   *
   * @param params - Request params.
   */
  static isValidVerifyVPRequest(
    params: unknown,
  ): asserts params is VerifyVPRequestParams {
    if (
      params === null ||
      _.isEmpty(params) ||
      !('verifiablePresentation' in params)
    ) {
      console.error(
        'Invalid verifyVP Params passed. "verifiablePresentation" must be passed as a parameter',
      );
      throw new Error(
        'Invalid verifyVP Params passed. "verifiablePresentation" must be passed as a parameter',
      );
    }

    const parameter = params as VerifyVPRequestParams;

    ParamUtils.checkRequiredProperty(
      parameter,
      'verifyVP',
      'verifiablePresentation',
      true,
    );
  }

  /**
   * Check Validation of Configure google request.
   *
   * @param params - Request params.
   */
  static isValidConfigueGoogleRequest(
    params: unknown,
  ): asserts params is GoogleToken {
    if (params === null || _.isEmpty(params) || !('accessToken' in params)) {
      console.error(
        'Invalid configureGoogleAccount Params passed. "accessToken" must be passed as a parameter',
      );
      throw new Error(
        'Invalid configureGoogleAccount Params passed. "accessToken" must be passed as a parameter',
      );
    }

    const parameter = params as GoogleToken;

    ParamUtils.checkValidString(
      parameter,
      'configureGoogleAccount',
      'accessToken',
      true,
    );
  }
}
