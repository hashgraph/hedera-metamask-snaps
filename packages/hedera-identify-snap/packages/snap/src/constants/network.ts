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

export const HEDERA_NETWORKS: string[] = ['mainnet', 'testnet', 'previewnet'];

export const HEDERA_CHAIN_IDS: Record<string, string> = {
  '0x127': 'mainnet',
  '0x128': 'testnet',
  '0x129': 'previewnet',
};

export const DEFAULT_HEDERA_MIRRORNODES: Record<string, string> = {
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
  testnet: 'https://testnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
};

const networks = {
  '1': 'ethereum',
  '8': 'ubiq',
  '10': 'optimism',
  '14': 'flare',
  '19': 'songbird',
  '20': 'elastos',
  '24': 'kardia',
  '25': 'cronos',
  '30': 'rsk',
  '40': 'telos',
  '42': 'lukso',
  '44': 'crab',
  '50': 'xdc',
  '52': 'csc',
  '55': 'zyx',
  '56': 'binance',
  '57': 'syscoin',
  '60': 'gochain',
  '61': 'ethereumclassic',
  '66': 'okexchain',
  '70': 'hoo',
  '82': 'meter',
  '87': 'nova network',
  '88': 'tomochain',
  '96': 'bitkub',
  '100': 'xdai',
  '106': 'velas',
  '108': 'thundercore',
  '119': 'enuls',
  '122': 'fuse',
  '128': 'heco',
  '137': 'polygon',
  '148': 'shimmer_evm',
  '151': 'rbn',
  '169': 'manta',
  '196': 'xlayer',
  '200': 'xdaiarb',
  '204': 'op_bnb',
  '246': 'energyweb',
  '248': 'oasys',
  '250': 'fantom',
  '252': 'fraxtal',
  '269': 'hpb',
  '288': 'boba',
  '295': 'hedera mainnet',
  '296': 'hedera testnet',
  '297': 'hedera previewnet',
  '311': 'omax',
  '314': 'filecoin',
  '321': 'kucoin',
  '324': 'zksync era',
  '336': 'shiden',
  '361': 'theta',
  '369': 'pulse',
  '388': 'cronos zkevm',
  '416': 'sx',
  '463': 'areon',
  '480': 'wc',
  '534': 'candle',
  '570': 'rollux',
  '592': 'astar',
  '698': 'matchain',
  '820': 'callisto',
  '888': 'wanchain',
  '957': 'lyra chain',
  '996': 'bifrost',
  '1030': 'conflux',
  '1088': 'metis',
  '1100': 'dymension',
  '1101': 'polygon zkevm',
  '1116': 'core',
  '1135': 'lisk',
  '1231': 'ultron',
  '1234': 'step',
  '1284': 'moonbeam',
  '1285': 'moonriver',
  '1440': 'living assets mainnet',
  '1559': 'tenet',
  '1625': 'gravity',
  '1729': 'reya network',
  '1975': 'onus',
  '1992': 'hubblenet',
  '1996': 'sanko',
  '2000': 'dogechain',
  '2001': 'milkomeda',
  '2002': 'milkomeda_a1',
  '2222': 'kava',
  '2332': 'soma',
  '2818': 'morph',
  '4337': 'beam',
  '4689': 'iotex',
  '5000': 'mantle',
  '5050': 'xlc',
  '5551': 'nahmii',
  '6001': 'bouncebit',
  '6969': 'tombchain',
  '7000': 'zetachain',
  '7070': 'planq',
  '7171': 'bitrock',
  '7560': 'cyeth',
  '7700': 'canto',
  '8217': 'klaytn',
  '8428': 'that',
  '8453': 'base',
  '8668': 'hela',
  '8822': 'iotaevm',
  '8899': 'jbc',
  '9001': 'evmos',
  '9790': 'carbon',
  '10000': 'smartbch',
  '13371': 'immutable zkevm',
  '15551': 'loop',
  '16507': 'genesys',
  '17777': 'eos evm',
  '22776': 'map protocol',
  '23294': 'oasis_sapphire',
  '32520': 'bitgert',
  '32659': 'fusion',
  '32769': 'zilliqa',
  '33139': 'apechain',
  '42161': 'arbitrum',
  '42170': 'arbitrum nova',
  '42220': 'celo',
  '42262': 'oasis',
  '42793': 'etherlink',
  '43114': 'avalanche',
  '47805': 'rei',
  '48900': 'zircuit',
  '52014': 'etn',
  '55555': 'reichain',
  '56288': 'boba_bnb',
  '59144': 'linea',
  '60808': 'bob',
  '71402': 'godwoken',
  '81457': 'blast',
  '88888': 'chiliz',
  '111188': 'real',
  '167000': 'taiko',
  '200901': 'bitlayer',
  '333999': 'polis',
  '534352': 'scroll',
  '420420': 'kekchain',
  '810180': 'zklink nova',
  '888888': 'vision',
  '7225878': 'saakuru',
  '7777777': 'zora',
  '245022934': 'neon',
  '1313161554': 'aurora',
  '1666600000': 'harmony',
  '11297108109': 'palm',
  '383414847825': 'zeniq',
  '836542336838601': 'curio',
} as Record<string, string>;

export function getNetworkNameFromChainId(chainIdHex: string): string {
  // Convert hexadecimal chainId to decimal
  const chainIdDecimal = parseInt(chainIdHex, 16).toString();

  // Find the network name
  const networkName = networks[chainIdDecimal];

  // Capitalize each word in the network name
  if (networkName) {
    return networkName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } else {
    return `EVM Network: ${chainIdDecimal}`;
  }
}
