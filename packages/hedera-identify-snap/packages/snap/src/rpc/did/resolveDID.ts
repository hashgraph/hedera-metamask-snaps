import { DIDResolutionResult } from '@veramo/core';
import { IdentitySnapParams } from '../../interfaces';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Resolve DID.
 *
 * @param identitySnapParams - Identity snap params.
 * @param didUrl - DID url.
 */
export async function resolveDID(
  identitySnapParams: IdentitySnapParams,
  didUrl?: string,
): Promise<DIDResolutionResult | null> {
  const { state, account } = identitySnapParams;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  let did = didUrl;
  // GET DID if not exists
  if (!did) {
    did = account.identifier.did;
  }
  return await agent.resolveDid({
    didUrl: did,
  });
}
