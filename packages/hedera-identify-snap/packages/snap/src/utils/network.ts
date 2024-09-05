export const convertChainIdFromHex = (chainId: string): string => {
  return parseInt(chainId, 16).toString();
};
