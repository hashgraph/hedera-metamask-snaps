import { availableProofFormats } from '../../types/constants';

/**
 * Function to get supported proof formats.
 *
 * @returns Proof formats.
 */
export function getSupportedProofFormats(): string[] {
  return availableProofFormats.map((key) => key);
}
