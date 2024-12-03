import React, {useState, useEffect} from 'react'
import {RadioGroup, Radio, RadioIndicator, RadioIcon, RadioLabel} from '@/components/ui/radio'
import {Text} from '@/components/ui/text'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Button, ButtonText} from '@/components/ui/button'
import {CircleIcon} from '@/components/ui/icon'
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
import {Input, InputField, InputSlot} from '@/components/ui/input'
import {z} from 'zod'
import {format, subHours} from 'date-fns'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {Keyboard} from 'react-native'
import {AlertTriangle} from 'lucide-react-native'
import CategorySelect from '@/components/category/select'
import DateSelect from '@/components/common/date-select'
import TagsInput from '@/components/common/tags-input'

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
  startDate: z.date().refine((val) => val, {message: 'Invalid date format'}),
  frequency: z.enum(['monthly', 'weekly', 'daily']),
  interval: z.string().refine((val) => !isNaN(val) && Number(val) > 0 && Number(val) < 13, {message: 'Interval must be between 1 and 12'}),
  endDate: z.date().nullable().optional().refine((val) => val === null || val, {message: 'Invalid date format'}),
  amount: z.string().refine((val) => !isNaN(val) && Number(val) > 0, {message: 'Please specify the correct amount'}),
  tags: z.array(z.string())
      .max(4, "You can add a maximum of 4 tags")
      .refine((tags) => new Set(tags).size === tags.length, {
        message: "Tags must be unique",
      })
      .optional(),
  note: z.string().max(30, "Note is too long").optional(),
}).refine(data => !data.endDate || subHours(data.endDate, 1) > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

const RecurringTransactionForm = ({transaction, onSubmit, onCancel, incomeCategories, expenseCategories, currency, mode}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      startDate: transaction?.recurrence ? new Date(transaction.recurrence.startDate) : new Date(),
      frequency: transaction?.recurrence ? transaction.recurrence.frequency : 'monthly',
      interval: transaction?.recurrence ? transaction.recurrence.interval.toString() : '1',
      endDate: transaction?.recurrence?.endDate ? new Date(transaction.recurrence.endDate) : null,
      kind: transaction?.category?.kind || 'expense',
      category: transaction?.category || undefined,
      amount: transaction?.amount?.value?.toFixed(2),
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
    reset()
    const tx = {
      ...transaction,
      ...data,
      categoryId: data.category.id,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: {
        currency,
        value: parseFloat(data.amount)
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
          <FormControlLabel>
            <FormControlLabelText>Category</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="category"
              control={control}
              render={({field: {onChange, value}}) => (
                  <CategorySelect
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
        <FormControl isInvalid={!!formState.errors.amount}>
          <FormControlLabel>
            <FormControlLabelText>Amount</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="amount"
              defaultValue=""
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input variant="outline">
                    <InputSlot>
                      <Text className="pr-0 pl-5 text-xl text-primary-500">{currency.symbol}</Text>
                    </InputSlot>
                    <InputField
                        autoComplete="off"
                        inputMode="decimal"
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        importantForAutofill="no"
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

        <FormControl isInvalid={!!formState.errors.startDate}>
          <FormControlLabel>
            <FormControlLabelText>Start date</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="startDate"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <DateSelect
                      mode={mode}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.startDate?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.frequency}>
          <FormControlLabel>
            <FormControlLabelText>Frequency</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="frequency"
              defaultValue="monthly"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <RadioGroup value={value} onChange={onChange}>
                    <HStack space="md">
                      <Radio value="daily" size="md">
                        <RadioLabel className="p-1">Daily</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon}/>
                        </RadioIndicator>
                      </Radio>
                      <Radio value="weekly" size="md">
                        <RadioLabel className="p-1">Weekly</RadioLabel>
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon}/>
                        </RadioIndicator>
                      </Radio>
                      <Radio value="monthly" size="md">
                        <RadioLabel className="p-1">Monthly</RadioLabel>
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
              {formState.errors?.frequency?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.interval}>
          <FormControlLabel>
            <FormControlLabelText>Interval</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="interval"
              defaultValue="1"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input variant="outline">
                    <InputField
                        className="pl-5"
                        autoComplete="off"
                        inputMode="numeric"
                        keyboardType="numeric"
                        placeholder=""
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        importantForAutofill="no"
                    />
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.interval?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!formState.errors.endDate}>
          <FormControlLabel>
            <FormControlLabelText>End date</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="endDate"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <DateSelect
                      isInvalid={!!formState.errors.endDate}
                      nullable
                      mode={mode}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.endDate?.message}
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
                  <Input variant="outline" className="pl-2">
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
                    placeholder=""
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
              )}
          />
          <FormControlHelper>
            <FormControlHelperText className="text-xs test-secondary-500">Enter a comma after each tag</FormControlHelperText>
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

export default RecurringTransactionForm