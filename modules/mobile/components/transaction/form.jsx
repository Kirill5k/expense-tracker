import React, {useState, useEffect} from 'react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Button, ButtonText} from '@/components/ui/button'
import ToggleButton from '@/components/common/toggle-button'
import {categoryOptions} from '@/constants/categories'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText
} from '@/components/ui/form-control'
import {Input, InputField} from '@/components/ui/input'
import {z} from 'zod'
import {format} from 'date-fns'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Keyboard} from 'react-native'
import {AlertTriangle} from 'lucide-react-native'
import CategorySelect from '@/components/category/select'
import DateSelect from '@/components/common/date-select'
import TagsInput from '@/components/common/tags-input'
import {MultipleAmountInput} from './amount-input'
import {isPositiveNumber, containsUniqueElements} from '@/utils/validations'
import {mergeClasses} from '@/utils/css'


const categorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required'),
  kind: z.enum(['expense', 'income']),
  color: z.string().min(1, 'Category color is required'),
  icon: z.string().min(1, 'Category icon is required'),
})

const transactionSchema = z.object({
  kind: z.enum(['expense', 'income']),
  category: z.preprocess(c => c || {id: '', name: '', kind: 'expense', color: '#000', icon: ''},
      categorySchema.refine((cat) => cat.id && cat.name, {message: 'Please select category'})),
  date: z.date().refine((v) => v, {message: 'Invalid date format'}),
  amounts: z.array(z.string().refine(isPositiveNumber, {message: 'Please specify the correct amount'}))
      .min(1)
      .refine(v => v.every(isPositiveNumber), {message: 'Please specify the correct amount'}),
  tags: z.array(z.string())
      .max(4, "You can add a maximum of 4 tags")
      .refine(containsUniqueElements, {message: "Tags must be unique"})
      .optional(),
  note: z.string().max(30, "Note is too long").optional(),
});

const TransactionForm = ({
  transaction,
  onSubmit,
  onCancel,
  incomeCategories,
  expenseCategories,
  currency,
  mode,
  flat = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      kind: transaction?.category?.kind || 'expense',
      category: transaction?.category || null,
      amounts: [transaction?.amount?.value?.toFixed(2) || ''],
      tags: transaction?.tags || [],
      note: transaction?.note || ''
    },
    resolver: zodResolver(transactionSchema)
  })

  const [categories, setCategories] = useState(transaction?.kind === 'income' ? incomeCategories : expenseCategories)
  const [loaded, setLoaded] = useState(false)

  const txKind = watch('kind')
  useEffect(() => {
    if (txKind === 'income' && loaded) {
      setCategories(incomeCategories)
      setValue('category', null)
    }
    if (txKind === 'expense' && loaded) {
      setCategories(expenseCategories)
      setValue('category', null)
    }
    setLoaded(true)
  }, [txKind])

  const handleFormSubmit = (data) => {
    const tx = {
      ...transaction,
      ...data,
      categoryId: data.category.id,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: {
        currency,
        value: parseFloat(data.amounts[0])
      }
    }
    onSubmit(tx)
  }

  const handleKeyPress = () => {
    Keyboard.dismiss();
  }

  return (
      <VStack space="lg" className="w-full">
        <FormControl isInvalid={!!formState.errors.kind}>
          <Controller
              name="kind"
              defaultValue="expense"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <ToggleButton
                      items={categoryOptions}
                      value={value}
                      onChange={onChange}
                  />
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
          <FormControlLabel>
            <FormControlLabelText>Category</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="category"
              control={control}
              render={({field: {onChange, value}}) => (
                  <CategorySelect
                      flat={flat}
                      isInvalid={!!formState.errors.category}
                      mode={mode}
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
        <FormControl isInvalid={!!formState.errors.amounts}>
          <FormControlLabel>
            <FormControlLabelText>Amount</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="amounts"
              defaultValue=""
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <MultipleAmountInput
                      flat={flat}
                      currency={currency}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      onSubmitEditing={handleKeyPress}
                  />
                  //TODO: add helper text when amounts > 1
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.amounts?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.date}>
          <FormControlLabel>
            <FormControlLabelText>Date</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="date"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <DateSelect
                      flat={flat}
                      mode={mode}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.date?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.note}>
          <FormControlLabel>
            <FormControlLabelText>Note</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="note"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input variant="outline" className={mergeClasses('pl-2.5',
                      flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                    <InputField
                        autoComplete="off"
                        placeholder=""
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                    />
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.note?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.tags}>
          <FormControlLabel>
            <FormControlLabelText>Tags</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="tags"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <TagsInput
                      flat={flat}
                      mode={mode}
                      placeholder="Add tags"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                  />
              )}
          />
          <FormControlHelper>
            <FormControlHelperText className="text-xs test-secondary-500">Enter a comma after each
              tag</FormControlHelperText>
          </FormControlHelper>
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.tags?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <HStack space="md" className="justify-end">
          <Button
              size="md"
              variant="outline"
              action="secondary"
              onPress={onCancel}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
              size="md"
              onPress={handleSubmit(handleFormSubmit)}
          >
            <ButtonText>Save</ButtonText>
          </Button>
        </HStack>
      </VStack>
  )
}

export default TransactionForm