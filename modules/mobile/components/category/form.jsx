import React from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Button, ButtonText} from '@/components/ui/button'
import {Input, InputField} from '@/components/ui/input'
import {RadioGroup, Radio, RadioIndicator, RadioIcon, RadioLabel} from '@/components/ui/radio'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText
} from "@/components/ui/form-control"
import {CircleIcon} from '@/components/ui/icon'
import IconSelect from '@/components/common/icon-select'
import {AlertTriangle} from 'lucide-react-native'
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from 'reanimated-color-picker';
import {Keyboard} from 'react-native'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {Controller, useForm} from 'react-hook-form'


const categorySchema = z.object({
  kind: z.enum(['expense', 'income']),
  name: z.string().min(1, 'Category name is required').max(30, 'Category name is too long'),
  color: z.string().min(1, 'Category color is required'),
  icon: z.string().min(1, 'Category icon is required'),
})

const CategoryForm = ({mode, category, onSubmit, onCancel}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    watch
  } = useForm({
    defaultValues: {
      kind: category?.kind || 'expense',
      name: category?.name || '',
      color: category?.color || 'red',
      icon: category?.icon || ''
    },
    resolver: zodResolver(categorySchema)
  })

  const color = watch('color')

  const handleFormSubmit = (data) => {
    reset()
    const cat = {...category, ...data}
    onSubmit(cat)
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
        <FormControl isInvalid={!!formState.errors.name}>
          <Controller
              name="name"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input
                      size="sm"
                      className="py-0 px-3"
                  >
                    <InputField
                        placeholder="Name"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                    />
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.name?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.color}>
          <Controller
              name="color"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <ColorPicker
                      style={{marginTop: '2%', marginBottom: '2%'}}
                      sliderThickness={18}
                      thumbSize={28}
                      thumbShape="circle"
                      value={value}
                      onComplete={c => onChange(c.hex)}
                  >
                    <HueSlider />
                  </ColorPicker>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.color?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors.icon}>
          <Controller
              name="icon"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <IconSelect
                    value={value}
                    valueColor={color}
                    onChange={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-xs">
              {formState.errors?.icon?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <HStack space="md" className="justify-end">
          <Button
              size="xs"
              variant="outline"
              action="secondary"
              onPress={onCancel}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
              size="xs"
              onPress={handleSubmit(handleFormSubmit)}
          >
            <ButtonText>Save</ButtonText>
          </Button>
        </HStack>
      </VStack>
  )
}

export default CategoryForm