import { IdentitySnapParams } from '../../interfaces';
import { getAccountStateByCoinType } from '../../snap/state';

/**
 * Function to get available methods.
 *
 * @param identitySnapParams - Identity snap params.
 */
export async function getCurrentDIDMethod(
  identitySnapParams: IdentitySnapParams,
): Promise<string> {
  const { state, account } = identitySnapParams;
  const accountState = await getAccountStateByCoinType(
    state,
    account.evmAddress,
  );
  return accountState.accountConfig.identity.didMethod;
}
