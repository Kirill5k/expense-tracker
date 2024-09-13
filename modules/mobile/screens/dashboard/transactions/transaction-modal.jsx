import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@/components/ui/modal";
import {RadioGroup, Radio, RadioIndicator, RadioIcon, RadioLabel} from '@/components/ui/radio'
import {Heading} from "@/components/ui/heading";
import {HStack} from "@/components/ui/hstack";
import {VStack} from "@/components/ui/vstack";
import {Button, ButtonText} from "@/components/ui/button";
import {Box} from "@/components/ui/box";
import {CircleIcon} from "@/components/ui/icon";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import {Input, InputField, InputIcon, InputSlot} from "@/components/ui/input";
import {z} from "zod"
import {parseISO, isValid} from 'date-fns'
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Keyboard} from "react-native";
import {AlertTriangle} from "lucide-react-native";
import React from "react";

const transactionSchema = z.object({
  kind: z.enum(['expense', 'income']),
  category: z.object({
    id: z.string().min(1, 'Category ID is required'),
    name: z.string().min(1, 'Category name is required'),
  }).refine((cat) => cat.id && cat.name, {message: 'Category is required'}),
  date: z.string().refine((val) => isValid(parseISO(val)), {message: 'Invalid date format'}),
  amount: z.number().positive('Please specify the correct amount'),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
});

/*
<RadioGroup value={values} onChange={setValues}>
      <HStack space="2xl">
        <Radio value="Credit Card">
          <RadioIndicator>
            <RadioIcon as={CircleIcon} />
          </RadioIndicator>
          <RadioLabel>Credit Card</RadioLabel>
        </Radio>
        <Radio value="Cash On Delivery">
          <RadioIndicator>
            <RadioIcon as={CircleIcon} />
          </RadioIndicator>
          <RadioLabel>Cash On Delivery</RadioLabel>
        </Radio>
      </HStack>
    </RadioGroup>
 */

const TransactionForm = ({onSubmit}) => {
  const {control, handleSubmit, reset, formState} = useForm({resolver: zodResolver(transactionSchema)});

  const handleFormSubmit = (data) => {
    console.log(data)
  }

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(handleFormSubmit)();
  };

  return (
      <VStack space="xl" className="w-full">
        <FormControl isInvalid={!!formState.errors.email}>
          <Controller
              name="kind"
              defaultValue="expense"
              control={control}
              rules={{
                validate: kind => transactionSchema.parseAsync({ kind })
                    .then(() => true)
                    .catch(e => e.message),
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                  <RadioGroup value={value} onChange={onChange}>
                    <HStack space="md">
                      <Radio value="expense" size="md">
                        <RadioLabel className="p-1">Expense</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                      </Radio>
                      <Radio value="income" size="md">
                        <RadioLabel className="p-1">Income</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                      </Radio>
                    </HStack>
                  </RadioGroup>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="md" as={AlertTriangle} />
            <FormControlErrorText>
              {formState.errors?.email?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
      </VStack>
  )
}

const TransactionModal = ({isOpen, onClose, transaction, currency, categories}) => {
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
                <TransactionForm/>
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