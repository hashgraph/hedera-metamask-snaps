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
