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

// export const getDefaultCredential = async (
//   agent: VeramoAgent,
//   type = 'Default',
// ): Promise<VerifiableCredential> => {
//   const createVcResult = await agent.createVC(
//     'vcData',
//     { name: 'Diego, the tester' },
//     'snap',
//     ['VerifiableCredential', type],
//   );
//   const getVcsResult = await agent.getVCs(
//     { store: 'snap' },
//     { type: 'id', filter: createVcResult[0].id },
//   );
//   return getVcsResult[0].data as VerifiableCredential;
// };

/**
 * Get RPC Request params.
 *
 * @param method - RPC method to be executed.
 * @param params - Params of the specific method.
 * @returns JSON request object.
 */
export function getRequestParams(method: string, params: any) {
  return {
    jsonrpc: '2.0',
    id: 'v7rOu495Q4NIBbo-8AqY3',
    method,
    params,
  };
}
