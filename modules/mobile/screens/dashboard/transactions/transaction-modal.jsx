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
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";
import {Box} from "@/components/ui/box";
import {CircleIcon, MaterialIcon} from "@/components/ui/icon";
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
import React, {useState} from "react";
import {Popover, PopoverBackdrop, PopoverContent, PopoverBody} from "@/components/ui/popover";

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

const TransactionForm = ({onSubmit}) => {
  const {control, handleSubmit, reset, formState} = useForm({resolver: zodResolver(transactionSchema)});

  const handleFormSubmit = (data) => {
    console.log(data)
    reset()
  }

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(handleFormSubmit)();
  };

  /*
  TODO:
   - kind on change -> clear category
   */

  return (
      <VStack space="md" className="w-full">
        <FormControl isInvalid={!!formState.errors.kind}>
          <Controller
              name="kind"
              defaultValue="expense"
              control={control}
              rules={{
                validate: kind => transactionSchema.parseAsync({kind})
                    .then(() => true)
                    .catch(e => e.message),
              }}
              render={({field: {onChange, onBlur, value}}) => (
                  <RadioGroup value={value} onChange={onChange}>
                    <HStack space="md">
                      <Radio value="expense" size="md">
                        <RadioLabel className="p-1">Expense</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon}/>
                        </RadioIndicator>
                      </Radio>
                      <Radio value="income" size="md">
                        <RadioLabel className="p-1">Income</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon}/>
                        </RadioIndicator>
                      </Radio>
                    </HStack>
                  </RadioGroup>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="md" as={AlertTriangle}/>
            <FormControlErrorText>
              {formState.errors?.kind?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.category}>
          <Controller
              name="category"
              defaultValue={null}
              control={control}
              rules={{
                validate: kind => transactionSchema.parseAsync({kind})
                    .then(() => true)
                    .catch(e => e.message),
              }}
              render={({field: {onChange, onBlur, value}}) => (
                  <Popover
                      offset={-32}
                      size="sm"
                      isOpen={openCategorySelect}
                      onOpen={() => setOpenCategorySelect(true)}
                      onClose={() => setOpenCategorySelect(false)}
                      trigger={(triggerProps) => {
                        return (
                            <Button
                                size="sm"
                                variant="outline"
                                action="secondary"
                                className="justify-between"
                                {...triggerProps}
                            >
                              <ButtonText>Category</ButtonText>
                              {openCategorySelect && <ButtonIcon as={MaterialIcon} code="chevron-up"/>}
                              {!openCategorySelect && <ButtonIcon as={MaterialIcon} code="chevron-down"/>}
                            </Button>
                        )
                      }}
                  >
                    <PopoverBackdrop/>
                    <PopoverContent className="bg-background-100 w-full max-w-[660px] p-0 shadow-hard-5">
                      <PopoverBody>
                        <Button className="w-full" onPress={() => onChange('Option 1')}>
                          <ButtonText>Option 1</ButtonText>
                        </Button>
                        <Button onPress={() => onChange('Option 2')}>
                          <ButtonText>Option 2</ButtonText>
                        </Button>
                        <Button onPress={() => onChange('Option 3')}>
                          <ButtonText>Option 3</ButtonText>
                        </Button>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="md" as={AlertTriangle}/>
            <FormControlErrorText>
              {formState.errors?.category?.message}
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