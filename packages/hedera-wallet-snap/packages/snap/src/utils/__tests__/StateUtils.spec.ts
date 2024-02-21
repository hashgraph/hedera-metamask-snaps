import { StateUtils } from '../StateUtils';
import { WalletAccountState, WalletSnapState } from '../../types/state';

describe('StateUtils', () => {
  describe('getEmptyAccountState', () => {
    it('returns a deep clone of emptyAccountState', () => {
      const state: WalletAccountState = StateUtils.getEmptyAccountState();
      expect(state).toEqual({
        keyStore: {
          curve: 'ECDSA_SECP256K1',
          privateKey: '',
          publicKey: '',
          address: '',
          hederaAccountId: '',
        },
        accountInfo: {},
      });

      // Verify deep clone by mutation
      state.keyStore.curve = 'ED25519';
      const newState: WalletAccountState = StateUtils.getEmptyAccountState();
      expect(newState.keyStore.curve).toBe('ECDSA_SECP256K1');
    });
  });

  describe('getInitialSnapState', () => {
    it('returns a deep clone of initialSnapState', () => {
      const snapState: WalletSnapState = StateUtils.getInitialSnapState();
      expect(snapState).toEqual({
        currentAccount: {},
        accountState: {},
        snapConfig: {
          dApp: {
            disablePopups: false,
            friendlyDapps: [],
          },
          snap: {
            acceptedTerms: true,
          },
        },
      });

      // Verify deep clone by mutation
      snapState.snapConfig.dApp.disablePopups = true;
      const newSnapState: WalletSnapState = StateUtils.getInitialSnapState();
      expect(newSnapState.snapConfig.dApp.disablePopups).toBe(false);
    });
  });
});
