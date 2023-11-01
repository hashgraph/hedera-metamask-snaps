import { createContext, PropsWithChildren, useState } from 'react';

export type ModalType = {
  title: string;
  content: string;
};

const ModalContext = createContext<{
  show: boolean;
  setShow: (showing: boolean) => void;
  modalData: ModalType | undefined;
  setModalData: (data: ModalType) => void;
}>({
  show: false,
  setShow: (showing: boolean) => {
    console.log('Not initialized', showing);
  },
  modalData: undefined,
  setModalData: (data: ModalType) => {
    console.log('Not initialized', data);
  },
});

const ModalContextProvider = ({ children }: PropsWithChildren<any>) => {
  const [show, setShow] = useState(false);
  const [modalData, setModalData] = useState<ModalType | undefined>(undefined);

  return (
    <ModalContext.Provider value={{ show, setShow, modalData, setModalData }}>
      {children}
    </ModalContext.Provider>
  );
};

export { ModalContext, ModalContextProvider };
