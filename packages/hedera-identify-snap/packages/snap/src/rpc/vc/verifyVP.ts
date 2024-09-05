import { VerifiablePresentation } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to verify VP.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vp - Verifiable Presentation.
 */
export async function verifyVP(
  identitySnapParams: IdentitySnapParams,
  vp: VerifiablePresentation,
): Promise<boolean | null> {
  const { state } = identitySnapParams;
  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // Verify the verifiable presentation(VP)
  const result = await agent.verifyPresentation({
    presentation: vp,
  });
  if (result.verified === false) {
    console.log('result: ', JSON.stringify(result, null, 4));
    console.log(
      'VP Verification Error: ',
      JSON.stringify(result.error, null, 4),
    );
  }
  return result.verified;
}
