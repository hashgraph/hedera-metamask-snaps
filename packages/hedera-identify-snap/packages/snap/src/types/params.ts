import { ProofFormat, W3CVerifiableCredential } from '@veramo/core';
import {
  QueryMetadata,
  SaveOptions,
} from '../plugins/veramo/verifiable-creds-manager';

export type CreateVCRequestParams = {
  vcValue: object;
  vcKey?: string;
  credTypes?: string[];
  options?: SaveOptions;
  accessToken?: string;
};

export type CreateVCResponseResult = {
  data: W3CVerifiableCredential;
  metadata: QueryMetadata;
};

export type ProofInfo = {
  proofFormat?: ProofFormat;
  type?: string;
  domain?: string;
  challenge?: string;
};

export type CreateVPOptions = {
  store: string | string[];
};

export type CreateVPRequestParams = {
  vcIds?: string[];
  vcs?: W3CVerifiableCredential[];
  options?: CreateVPOptions;
  proofInfo?: ProofInfo;
};

export type CreateNewHederaAccountRequestParams = {
  hbarAmountToSend: number;
  newAccountPublickey?: string;
  newAccountEvmAddress?: string;
};
