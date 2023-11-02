export const networkOptions = [
  { value: 'testnet', label: 'Testnet' },
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'previewnet', label: 'Previewnet' },
] as NetworkOption[];

export type NetworkOption = {
  value: string;
  label: string;
};
