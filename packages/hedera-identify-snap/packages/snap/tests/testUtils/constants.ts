import cloneDeep from 'lodash.clonedeep';
import { IdentitySnapState } from '../../src/interfaces';
import { getEmptyAccountState } from '../../src/utils/config';

export const privateKey =
  '0x63ce0077f0d617dbf54d5f335de2983313c6356f25b45e0f68f85bee1490a6ae';

export const mnemonic =
  'final runway match relax bamboo carry budget guilt dish weapon magnet alarm';
export const ETH_ADDRESS = '0xf49d65c80c3d2d98231654513b2da4652f09c9fe';
export const ETH_CHAIN_ID = '0x1';

export const HEDERA_CHAIN_ID = {
  mainnet: '0x127',
  testnet: '0x128',
  previewnet: '0x129',
  localnet: '0x12a',
};

export const EVM_ACCOUNT = {
  chainId: '137', // polygon
  address: '0xf49d65c80c3d2d98231654513b2da4652f09c9fe',
  privatekey:
    'd787278d71bc9b50e814705ca48fcf652e08fb5eb73773e98146c48846bde456',
};

export const HEDERA_ACCOUNT = {
  accountId: '0.0.15215',
  address: '0x7d871f006d97498ea338268a956af94ab2e65cdd',
  privateKey:
    '2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c',
};

export const publicKey =
  '0x0480a9cd48fd436f8c1f81b156eb615618cd573c3eb1e6d937a17b8222027cae850a9f561d414001a8bdefdb713c619d2caf08a0c9655b0cf42de065bc51e0169a';
export const signedMsg =
  '0x30eb4dbf93e7bfdb109ed03f7803f2378fa27d18ddc233cb3d121b5ba13253fe2515076d1ba66f3dc282c182479b843c925c62eb1f5a0676bcaf995e8e7552941c';

export const exampleDIDPkh = `did:pkh:eip155:4:${ETH_ADDRESS}`;

const defaultSnapState: IdentitySnapState = {
  currentAccount: {
    evmAddress: ETH_ADDRESS,
    method: '',
    identifier: {} as any,
    privateKey: '',
    publicKey: '',
  },
  accountState: {
    '60': {
      '0xf49d65c80c3d2d98231654513b2da4652f09c9fe': getEmptyAccountState(),
    },
  },
  snapConfig: {
    dApp: {
      disablePopups: false,
      friendlyDapps: [],
    },
    snap: {
      acceptedTerms: true,
    },
  },
};

export const getDefaultSnapState = (): IdentitySnapState => {
  // defaultSnapState.accountState[address].publicKey = publicKey;
  return cloneDeep(defaultSnapState);
};

export const getSnapStateWithIdentifiers = (): IdentitySnapState => {
  const snapStateWithIdentifiers = getDefaultSnapState();
  return snapStateWithIdentifiers;
};
