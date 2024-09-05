import { createContext, PropsWithChildren, useState } from 'react';

const VcContext = createContext({
  vcId: '',
  setVcId: (vcId: string) => {
    console.log('Not initialized', vcId);
  },
  vc: {},
  setVc: (vc: any) => {
    console.log('Not initialized', vc);
  },
  vcIdsToBeRemoved: '',
  setVcIdsToBeRemoved: (ids: any) => {
    console.log('Not initialized', ids);
  },
  vp: {},
  setVp: (vp: any) => {
    console.log('Not initialized', vp);
  },
});

const VcContextProvider = ({ children }: PropsWithChildren<any>) => {
  const [vcId, setVcId] = useState('');
  const [vc, setVc] = useState({});
  const [vp, setVp] = useState({});
  const [vcIdsToBeRemoved, setVcIdsToBeRemoved] = useState('');

  return (
    <VcContext.Provider
      value={{
        vcId,
        setVcId,
        vc,
        setVc,
        vcIdsToBeRemoved,
        setVcIdsToBeRemoved,
        vp,
        setVp,
      }}
    >
      {children}
    </VcContext.Provider>
  );
};

export { VcContext, VcContextProvider };
