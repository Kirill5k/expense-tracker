import React from "react";
import {
  Modal as GSModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@/components/ui/modal";
import {Heading} from "@/components/ui/heading";
import {Button, ButtonText} from "@/components/ui/button";

const Modal = ({isOpen, onClose, onSuccess, headerTitle, successButtonTitle, children}) => {
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
          <ModalFooter className="pt-3">
            <Button
                size="xs"
                variant="outline"
                action="secondary"
                onPress={onClose}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
                size="xs"
                onPress={onSuccess}
            >
              <ButtonText>{successButtonTitle}</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </GSModal>
  )
}

export default Modal