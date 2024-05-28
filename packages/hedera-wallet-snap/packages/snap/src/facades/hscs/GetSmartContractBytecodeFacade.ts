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

import { rpcErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { GetSmartContractBytecodeCommand } from '../../commands/hscs/GetSmartContractBytecodeCommand';
import type { GetSmartContractDetailsRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class GetSmartContractBytecodeFacade {
  /**
   * Gets the bytecode of a smart contract on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param getSmartContractBytecodeParams - Parameters for getting the smart contract bytecode.
   * @returns Bytecode of the smart contract.
   */
  public static async getSmartContractBytecode(
    walletSnapParams: WalletSnapParams,
    getSmartContractBytecodeParams: GetSmartContractDetailsRequestParams,
  ): Promise<string> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { contractId } = getSmartContractBytecodeParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let bytecode = '';
    try {
      const panelToShow = [
        heading('Get a smart contract bytecode'),
        text(
          `Learn more about getting smart contract bytecode [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/get-smart-contract-bytecode)`,
        ),
        text(
          `You are about to get the bytecode of a smart contract with the following parameters:`,
        ),
        divider(),
        copyable(`Contract ID: ${contractId}`),
      ];

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        const errMessage = 'User rejected the query';
        console.error(errMessage);
        throw rpcErrors.transactionRejected(errMessage);
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw rpcErrors.resourceUnavailable('hedera client returned null');
      }
      const command = new GetSmartContractBytecodeCommand(contractId);
      bytecode = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage =
        'Error while trying to get the smart contract bytecode';
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return bytecode;
  }
}
