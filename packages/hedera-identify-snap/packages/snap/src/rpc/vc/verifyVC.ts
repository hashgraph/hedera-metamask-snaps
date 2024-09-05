import { W3CVerifiableCredential } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to verify VC.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vc - Verifiable Credential.
 */
export async function verifyVC(
  identitySnapParams: IdentitySnapParams,
  vc: W3CVerifiableCredential,
): Promise<boolean | null> {
  const { state } = identitySnapParams;
  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // Verify the verifiable credential(VC)
  const result = await agent.verifyCredential({ credential: vc });
  if (result.verified === false) {
    console.log('result: ', JSON.stringify(result, null, 4));
    console.log(
      'VC Verification Error: ',
      JSON.stringify(result.error, null, 4),
    );
  }
  return result.verified;
}
