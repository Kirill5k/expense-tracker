import React from "react";
import {
  Modal as GSModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody
} from "@/components/ui/modal";
import {Heading} from "@/components/ui/heading";

const Modal = ({isOpen, onClose, headerTitle, children}) => {
  return (
      <GSModal
          size="md"
          isOpen={isOpen}
          onClose={onClose}
          avoidKeyboard
      >
        <ModalBackdrop/>
        <ModalContent className="p-4">
          <ModalHeader>
            <Heading size="md" className="font-semibold">
              {headerTitle}
            </Heading>
          </ModalHeader>
          <ModalBody className="mb-0">
            {children}
          </ModalBody>
        </ModalContent>
      </GSModal>
  )
}

export default Modal