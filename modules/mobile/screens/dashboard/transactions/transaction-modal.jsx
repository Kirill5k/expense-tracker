import {Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter} from "@/components/ui/modal";
import {Heading} from "@/components/ui/heading";
import {HStack} from "@/components/ui/hstack";
import {VStack} from "@/components/ui/vstack";
import {Button, ButtonText} from "@/components/ui/button";
import {Box} from "@/components/ui/box";
import {MaterialIcon, Icon} from "@/components/ui/icon";
import colors from '@/constants/colors';

const TransactionModal = ({isOpen, onClose, transaction, mode}) => {
  return (
      <Box>
        <Modal
            size="md"
            isOpen={isOpen}
            onClose={onClose}
            avoidKeyboard
        >
          <ModalBackdrop />
          <ModalContent className="p-4">
            <ModalHeader>
              <HStack className="items-center">
                <Heading size="sm" className="font-semibold">
                  Transaction
                </Heading>
              </HStack>
              <ModalCloseButton>
                <Icon
                    as={MaterialIcon}
                    size="md"
                    code="close"
                    displayColor={colors[mode].tabIconDefault}
                    displaySize={18}
                />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody className="mb-0">
              <VStack space="md">
                <Heading>Modal content</Heading>
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