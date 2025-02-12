/*-
 *
 * Hedera Identify Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
