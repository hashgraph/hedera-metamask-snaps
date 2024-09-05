/* eslint-disable */

// import { SnapProvider } from '@metamask/snap-types';
// import {
//   addFriendlyDapp, getCurrentNetwork,
//   getPublicKey,
//   removeFriendlyDapp,
//   snapConfirm,
//   togglePopups
// } from '../../src/rpc/snap/utils';
// import {
//   address,
//   getDefaultSnapState,
//   publicKey,
//   snapConfirmParams
// } from '../testUtils/constants';
// import { createMockWallet, WalletMock } from '../testUtils/wallet.mock';

// describe.skip('Utils [snap]', () => {
//   let walletMock: SnapProvider & WalletMock;

//   beforeEach(() => {
//     walletMock = createMockWallet();
//   });

//   describe.skip('getCurrentNetwork', () => {
//     it('should succeed for mainnet (0x1)', async () => {
//       walletMock.rpcMocks.eth_chainId.mockResolvedValue('0x1');

//       await expect(getCurrentNetwork(walletMock)).resolves.toEqual('0x1');

//       expect(walletMock.rpcMocks.eth_chainId).toHaveBeenCalledTimes(1);

//       expect.assertions(2);
//     });

//     it('should succeed for rinkeby (0x4)', async () => {
//       walletMock.rpcMocks.eth_chainId.mockResolvedValue('0x4');

//       await expect(getCurrentNetwork(walletMock)).resolves.toEqual('0x4');

//       expect(walletMock.rpcMocks.eth_chainId).toHaveBeenCalledTimes(1);

//       expect.assertions(2);
//     });
//   });

//   describe.skip('togglePopups', () => {
//     it('should succeed and toggle popups (off -> on)', async () => {
//       const initialState = getDefaultSnapState();

//       await expect(
//         togglePopups(walletMock, initialState),
//       ).resolves.not.toThrow();

//       // Call should be `update` with the correct arguments
//       const expectedState = getDefaultSnapState();
//       expectedState.snapConfig.dApp.disablePopups = true;
//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });

//     it('should succeed and toggle popups (on -> off)', async () => {
//       const initialState = getDefaultSnapState();
//       initialState.snapConfig.dApp.disablePopups = true;

//       await expect(
//         togglePopups(walletMock, initialState),
//       ).resolves.not.toThrow();

//       // Call should be `update` with the correct arguments
//       const expectedState = getDefaultSnapState();
//       expectedState.snapConfig.dApp.disablePopups = false;

//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });
//   });

//   describe.skip('addFriendlyDapp', () => {
//     it('should succeed adding dApp when friendlyDapps empty', async () => {
//       const dApp = 'test_dApp_42';
//       const initialState = getDefaultSnapState();

//       walletMock.rpcMocks.snap_manageState.mockResolvedValue(initialState);

//       await expect(
//         addFriendlyDapp(walletMock, initialState, dApp),
//       ).resolves.not.toThrow();

//       const expectedState = getDefaultSnapState();
//       expectedState.snapConfig.dApp.friendlyDapps = [dApp];

//       // Call should be `update` with the correct arguments
//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });

//     it('should succeed adding dApp when friendlyDapps not empty', async () => {
//       const dApp = 'test_dApp_42';
//       const initialState = getDefaultSnapState();
//       initialState.snapConfig.dApp.friendlyDapps = [
//         'test_dApp_1',
//         'test_dApp_2',
//         'test_dApp_3',
//       ];

//       walletMock.rpcMocks.snap_manageState.mockResolvedValue(initialState);

//       await expect(
//         addFriendlyDapp(walletMock, initialState, dApp),
//       ).resolves.not.toThrow();

//       const expectedState = getDefaultSnapState();
//       expectedState.snapConfig.dApp.friendlyDapps = [
//         'test_dApp_1',
//         'test_dApp_2',
//         'test_dApp_3',
//         dApp,
//       ];

//       // Call should be `update` with the correct arguments
//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });
//   });

//   describe.skip('removeFriendlyDapp', () => {
//     it('should succeed removing dApp when there is only one', async () => {
//       const dApp = 'test_dApp_42';
//       const initialState = getDefaultSnapState();
//       initialState.snapConfig.dApp.friendlyDapps = [dApp];

//       walletMock.rpcMocks.snap_manageState.mockResolvedValue(initialState);

//       await expect(
//         removeFriendlyDapp(walletMock, initialState, dApp),
//       ).resolves.not.toThrow();

//       const expectedState = getDefaultSnapState();

//       // Call should be `update` with the correct arguments
//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });

//     it('should succeed removing dApp when there are many', async () => {
//       const dApp = 'test_dApp_42';
//       const initialState = getDefaultSnapState();
//       initialState.snapConfig.dApp.friendlyDapps = [
//         'test_dApp_1',
//         dApp,
//         'test_dApp_2',
//         'test_dApp_3',
//       ];

//       walletMock.rpcMocks.snap_manageState.mockResolvedValue(initialState);

//       await expect(
//         removeFriendlyDapp(walletMock, initialState, dApp),
//       ).resolves.not.toThrow();

//       const expectedState = getDefaultSnapState();
//       expectedState.snapConfig.dApp.friendlyDapps = [
//         'test_dApp_1',
//         'test_dApp_2',
//         'test_dApp_3',
//       ];

//       // Call should be `update` with the correct arguments
//       expect(walletMock.rpcMocks.snap_manageState).toHaveBeenCalledWith(
//         'update',
//         expectedState,
//       );

//       expect.assertions(2);
//     });
//   });

//   describe.skip('getPublicKey', async () => {
//     // it('should succeed getting public key', async () => {
//     //   const initialState = getDefaultSnapState();
//     //   initialState.accountState[address].publicKey = '';

//       await expect(
//         getPublicKey(walletMock, initialState, address),
//       ).resolves.toEqual(publicKey);

//     //   expect.assertions(1);
//     // });

//     it('should succeed getting public key (saved in snap state)', async () => {
//       const initialState = getDefaultSnapState();

//       await expect(
//         getPublicKey(walletMock, initialState, address),
//       ).resolves.toEqual(publicKey);

//       expect.assertions(1);
//     });

//     it('should fail getting public key (user denied)', async () => {
//       const initialState = getDefaultSnapState();
//       initialState.accountState[address].publicKey = '';

//       walletMock.rpcMocks.personal_sign.mockRejectedValue(new Error());

//       await expect(
//         getPublicKey(walletMock, initialState, address),
//       ).rejects.toThrow(new Error('User denied request'));

//       expect.assertions(1);
//     });
//   });

//   describe('snapConfirm', () => {
//     it('should return true', async () => {
//       walletMock.rpcMocks.snap_confirm.mockResolvedValue(true);

//       await expect(snapConfirm(walletMock, snapConfirmParams)).resolves.toEqual(
//         true,
//       );

//       expect(walletMock.rpcMocks.snap_confirm).toHaveBeenCalledWith(
//         snapConfirmParams,
//       );

//       expect.assertions(2);
//     });

//     it('should return false', async () => {
//       walletMock.rpcMocks.snap_confirm.mockResolvedValue(false);

//       await expect(snapConfirm(walletMock, snapConfirmParams)).resolves.toEqual(
//         false,
//       );

//       expect(walletMock.rpcMocks.snap_confirm).toHaveBeenCalledWith(
//         snapConfirmParams,
//       );

//       expect.assertions(2);
//     });
//   });
// });
