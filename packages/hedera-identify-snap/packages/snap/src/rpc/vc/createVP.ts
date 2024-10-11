import {
  ProofFormat,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core';
import { IdentitySnapParams, SnapDialogParams } from '../../interfaces';
import {
  IDataManagerQueryResult,
  QueryOptions,
} from '../../plugins/veramo/verifiable-creds-manager';
import { generateVCPanel, snapDialog } from '../../snap/dialog';
import {
  CreateVPOptions,
  CreateVPRequestParams,
  ProofInfo,
} from '../../types/params';
import { getVeramoAgent } from '../../veramo/agent';

/**
 * Function to create verifiable presentation.
 *
 * @param identitySnapParams - Identity snap params.
 * @param vpRequestParams - VP request params.
 */
export async function createVP(
  identitySnapParams: IdentitySnapParams,
  vpRequestParams: CreateVPRequestParams,
): Promise<VerifiablePresentation | null> {
  const { origin, snap, state, account } = identitySnapParams;

  const {
    vcIds = [],
    vcs = [],
    proofInfo = {} as ProofInfo,
    options,
  } = vpRequestParams || {};
  const { store = 'snap' } = options || {};
  const optionsFiltered = { store } as CreateVPOptions;

  const proofFormat = proofInfo?.proofFormat
    ? proofInfo.proofFormat
    : ('jwt' as ProofFormat);
  const type = proofInfo?.type ? proofInfo.type : 'Custom';
  const domain = proofInfo?.domain;
  const challenge = proofInfo?.challenge;

  // Get Veramo agent
  const agent = await getVeramoAgent(snap, state);

  // GET DID
  const { did } = account.identifier;

  const vcsRes: VerifiableCredential[] = [];
  const vcsWithMetadata: IDataManagerQueryResult[] = [];

  // Iterate through vcIds
  for (const vcId of vcIds) {
    const vcObj = (await agent.queryVC({
      filter: {
        type: 'id',
        filter: vcId,
      },
      options: optionsFiltered as QueryOptions,
    })) as IDataManagerQueryResult[];

    if (vcObj.length > 0) {
      const { data, metadata } = vcObj[0];
      vcsRes.push(data as VerifiableCredential);
      vcsWithMetadata.push({
        data,
        metadata,
      });
    }
  }

  // Iterate through vcs
  vcs.forEach(function (vc, index) {
    vcsRes.push(vc as VerifiableCredential);
    vcsWithMetadata.push({
      data: vc,
      metadata: { id: `External VC #${(index + 1).toString()}`, store: 'snap' },
    });
  });

  if (vcsRes.length === 0) {
    return null;
  }
  const config = state.snapConfig;

  const header = 'Create Verifiable Presentation';
  const prompt = 'Do you wish to create a VP from the following VCs?';
  const description =
    'A Verifiable Presentation is a secure way for someone to present information about themselves or their identity to someone else while ensuring that the information is accureate and trustworthy';
  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: await generateVCPanel(
      origin,
      header,
      prompt,
      description,
      vcsWithMetadata,
    ),
  };
  if (config.dApp.disablePopups || (await snapDialog(snap, dialogParams))) {
    // Generate a Verifiable Presentation from VCs
    const vp = await agent.createVerifiablePresentation({
      presentation: {
        holder: did, //
        type: ['VerifiablePresentation', type],
        verifiableCredential: vcsRes,
      },
      proofFormat, // The desired format for the VerifiablePresentation to be created
      domain, // Optional string domain parameter to add to the verifiable presentation
      challenge, // Optional (only JWT) string challenge parameter to add to the verifiable presentation
    });
    return vp;
  }
  throw new Error('User rejected');
}
