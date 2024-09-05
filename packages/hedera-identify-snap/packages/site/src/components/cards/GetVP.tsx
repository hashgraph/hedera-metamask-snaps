import { ProofInfo } from '@tuum-tech/identify/src/types/params';
import { VerifiablePresentation, W3CVerifiableCredential } from '@veramo/core';
import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import { VcContext } from '../../contexts/VcContext';
import useModal from '../../hooks/useModal';
import {
  createVP,
  getCurrentMetamaskAccount,
  getCurrentNetwork,
  shouldDisplayReconnectButton,
} from '../../utils';
import { Card, SendHelloButton, TextInput } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setCurrentChainId: React.Dispatch<React.SetStateAction<string>>;
};

const GetVP: FC<Props> = ({ setMetamaskAddress, setCurrentChainId }) => {
  const { vcId, setVcId, setVp } = useContext(VcContext);
  const { vc, setVc } = useContext(VcContext);
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleCreateVPClick = async () => {
    setLoading(true);
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);
      setCurrentChainId(await getCurrentNetwork());

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const proofInfo: ProofInfo = {
        proofFormat: 'jwt',
        type: 'ProfileNamesPresentation',
      };
      console.log('vcIds: ', vcId);
      // console.log('vc: ', vc);
      const vp = (await createVP(
        metamaskAddress,
        {
          // vcIds: vcId.trim().split(','),
          vcs: [vc as W3CVerifiableCredential],
          proofInfo,
        },
        externalAccountParams,
      )) as VerifiablePresentation;
      setVp(vp);
      console.log(`Your VP is: ${JSON.stringify(vp, null, 4)}`);
      showModal({
        title: 'Get VP',
        content: `Your VP is: ${JSON.stringify(vp, null, 4)}`,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'getVP',
        description: 'Generate Verifiable Presentation from your VC',
        form: (
          <>
            <ExternalAccount ref={externalAccountRef} />
            {/* <label>
              Enter the Verifiable Credential ID
              <TextInput
                rows={2}
                value={vcId}
                onChange={(e) => setVcId(e.target.value)}
                fullWidth
              />
            </label> */}
            <label>
              Enter your Verifiable Credential
              <TextInput
                rows={3}
                value={JSON.stringify(vc)}
                onChange={(e) => setVc(e.target.value)}
                fullWidth
              />
            </label>
          </>
        ),
        button: (
          <SendHelloButton
            buttonText="Generate VP"
            onClick={handleCreateVPClick}
            disabled={!state.installedSnap}
            loading={loading}
          />
        ),
      }}
      disabled={!state.installedSnap}
      fullWidth={
        state.isFlask &&
        Boolean(state.installedSnap) &&
        !shouldDisplayReconnectButton(state.installedSnap)
      }
    />
  );
};

export { GetVP };
