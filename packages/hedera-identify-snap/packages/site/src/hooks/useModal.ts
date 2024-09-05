import { useContext } from 'react';
import { ModalContext, ModalType } from '../contexts/ModalContext';

export default function useModal() {
  const { setShow, setModalData } = useContext(ModalContext);

  const showModal = (data: ModalType) => {
    setModalData(data);
    setShow(true);
  };

  const hideModal = () => setShow(false);

  return {
    showModal,
    hideModal,
  };
}
