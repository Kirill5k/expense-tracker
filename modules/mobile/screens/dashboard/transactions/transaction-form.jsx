import React, {useState, useEffect} from "react";
import {RadioGroup, Radio, RadioIndicator, RadioIcon, RadioLabel} from '@/components/ui/radio'
import {Text} from "@/components/ui/text";
import {HStack} from "@/components/ui/hstack";
import {VStack} from "@/components/ui/vstack";
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
import CategorySelect from "@/components/category/select";

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

const TransactionForm = ({onSubmit, incomeCategories, expenseCategories, currency = '£'}) => {
  const {control, handleSubmit, reset, formState, setValue, watch} = useForm({resolver: zodResolver(transactionSchema)});

  const [categories, setCategories] = useState(expenseCategories)

  const txKind = watch('kind')
  useEffect(() => {
    if (txKind === 'income') {
      setCategories(incomeCategories)
      setValue('category', null)
    }
    if (txKind === 'expense') {
      setCategories(expenseCategories)
      setValue('category', null)
    }
  }, [txKind]);

  const handleFormSubmit = (data) => {
    console.log(data)
    reset()
  }

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(handleFormSubmit)();
  }

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
                  <CategorySelect
                      items={categories}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="md" as={AlertTriangle}/>
            <FormControlErrorText>
              {formState.errors?.category?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.amount}>
          <Controller
              name="amount"
              defaultValue={null}
              control={control}
              rules={{
                validate: amount => transactionSchema.parseAsync({amount})
                    .then(() => true)
                    .catch(e => e.message),
              }}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input
                      variant="outline"
                      size="sm"
                  >
                    <InputSlot className="pl-4">
                      <Text className="text-primary-500">{currency}</Text>
                    </InputSlot>
                    <InputField
                        inputMode="numeric"
                        keyboardType="decimal-pad"
                        placeholder="Amount"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        autoComplete="off"
                        textContentType="none"
                    />
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="md" as={AlertTriangle}/>
            <FormControlErrorText>
              {formState.errors?.amount?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
      </VStack>
  )
}

export default TransactionForm