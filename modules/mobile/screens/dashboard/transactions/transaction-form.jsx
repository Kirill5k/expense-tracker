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

const emptyCategory = {id: '', name: '', kind: 'expense', color: '#000', icon: ''}

const categorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required'),
  kind: z.enum(['expense', 'income']),
  color: z.string().min(1, 'Category color is required'),
  icon: z.string().min(1, 'Category icon is required'),
})

const transactionSchema = z.object({
  kind: z.enum(['expense', 'income']),
  category: z.preprocess(c => c || emptyCategory,
      categorySchema.refine((cat) => cat.id && cat.name, {message: 'Please select category'})),
  date: z.string().refine((val) => isValid(parseISO(val)), {message: 'Invalid date format'}),
  amount: z.string().refine((val) => !isNaN(val) && Number(val) > 0, {message: 'Please specify the correct amount'}),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
});

const TransactionForm = ({onSubmit, incomeCategories, expenseCategories, currency = '£'}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    setValue,
    watch
  } = useForm({defaultValues: {kind: 'expense', category: null}, resolver: zodResolver(transactionSchema)});

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

  const values = watch()
  useEffect(() => {
    console.log('cat', values)
  }, [values])

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
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.kind?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.category}>
          <Controller
              name="category"
              control={control}
              render={({field: {onChange, value}}) => (
                  <CategorySelect
                      items={categories}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.category?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.amount}>
          <Controller
              name="amount"
              defaultValue=""
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input
                      variant="outline"
                      size="sm"
                  >
                    <InputSlot>
                      <Text className="px-1 pl-5 text-xl text-primary-500">{currency}</Text>
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
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.amount?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
      </VStack>
  )
}

export default TransactionForm