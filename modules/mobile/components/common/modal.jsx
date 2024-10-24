import {Modal as ReactNativeModal, Platform} from 'react-native'
import {
  Modal as GlueStackModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody
} from '@/components/ui/modal'
import {Heading} from '@/components/ui/heading'
import {VStack} from '@/components/ui/vstack'

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetIcon,
} from '@/components/ui/actionsheet'
import {KeyboardAvoidingView} from '@/components/ui/keyboard-avoiding-view'

export const GSModal = ({isOpen, onClose, headerTitle, children}) => {
  return (
      <GlueStackModal
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
      </GlueStackModal>
  )
}

export const RNModal = ({isOpen, onClose, headerTitle, children}) => {
  return (
      <ReactNativeModal
          presentationStyle="formSheet"
          animationType="slide"
          visible={isOpen}
          onDismiss={onClose}
          avoidKeyboard
      >
        <VStack className="py-12 px-8">
          <Heading size="md" className="font-semibold">
            {headerTitle}
          </Heading>
          {children}
        </VStack>
      </ReactNativeModal>
  )
}

export const ASModal = ({isOpen, onClose, headerTitle, children}) => {

  return (
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Actionsheet isOpen={isOpen} onClose={onClose}>
          <ActionsheetBackdrop />
          <ActionsheetContent className="py-4 px-8">
            <Heading size="md" className="w-full text-left font-semibold">
              {headerTitle}
            </Heading>
            {children}
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
  )
}

export default ASModal