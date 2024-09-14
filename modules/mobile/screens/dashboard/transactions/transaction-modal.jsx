import React from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@/components/ui/modal";
import {Heading} from "@/components/ui/heading";
import {VStack} from "@/components/ui/vstack";
import {Button, ButtonText} from "@/components/ui/button";
import {Box} from "@/components/ui/box";
import TransactionForm from "./transaction-form";


const TransactionModal = ({isOpen, onClose, transaction, currency, incomeCategories, expenseCategories}) => {
  return (
      <Box>
        <Modal
            size="md"
            isOpen={isOpen}
            onClose={onClose}
            avoidKeyboard
        >
          <ModalBackdrop/>
          <ModalContent className="p-4">
            <ModalHeader>
              <Heading size="sm" className="font-semibold">
                Transaction
              </Heading>
            </ModalHeader>
            <ModalBody className="mb-0">
              <VStack space="md">
                <TransactionForm
                    expenseCategories={expenseCategories}
                    incomeCategories={incomeCategories}
                />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                  size="xs"
                  variant="outline"
                  action="secondary"
                  onPress={onClose}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
  )
}

export default TransactionModal