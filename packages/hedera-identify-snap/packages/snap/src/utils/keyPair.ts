import { assertArgument, HDNodeWallet, Mnemonic } from 'ethers'
import { DEFAULTCOINTYPE } from '../types/constants';

export const generateWallet = async (
  evmAddress: string,
): Promise<HDNodeWallet> => {
  const entropy = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      salt: evmAddress,
    },
  });

  let nodeWallet = HDNodeWallet.fromMnemonic(Mnemonic.fromEntropy(entropy));
  nodeWallet = await derivePathForWallet(nodeWallet, `m/44/${DEFAULTCOINTYPE}/0/0/0`);

  return nodeWallet;
};

export const derivePathForWallet = async (
  node: HDNodeWallet,
  path: string,
) => {
  const components = path.split('/');

  assertArgument(
    components.length > 0 && (components[0] === 'm' || node.depth > 0),
    'invalid path',
    'path',
    path,
  );

  if (components[0] === 'm') {
    components.shift();
  }

  let result: HDNodeWallet = node;

  const HardenedBit = 0x80000000;
  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    if (component.match(/^[0-9]+'$/u)) {
      const index = parseInt(
        component.substring(0, component.length - 1),
        10,
      );

      assertArgument(
        index < HardenedBit,
        'invalid path index',
        `path[${i}]`,
        component,
      );
      result = result.deriveChild(HardenedBit + index);
    } else if (component.match(/^[0-9]+$/u)) {
      const index = parseInt(component, 10);
      assertArgument(
        index < HardenedBit,
        'invalid path index',
        `path[${i}]`,
        component,
      );
      result = result.deriveChild(index);
    } else {
      assertArgument(
        false,
        'invalid path component',
        `path[${i}]`,
        component,
      );
    }
  }

  return result;
}
