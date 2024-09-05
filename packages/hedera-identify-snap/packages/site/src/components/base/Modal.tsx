import { useCallback, useContext, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { ModalContext } from '../../contexts/ModalContext';

const CustomModal = () => {
  const { show, setShow, modalData } = useContext(ModalContext);

  const handleClose = useCallback(() => setShow(false), [setShow]);

  const content = useMemo(() => {
    try {
      const data = JSON.parse(modalData?.content || '');
      return JSON.stringify(data, undefined, 2);
    } catch (e) {
      return modalData?.content;
    }
  }, [modalData]);

  return (
    <Modal show={show} onHide={handleClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{modalData?.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre>{content}</pre>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { CustomModal as Modal };
