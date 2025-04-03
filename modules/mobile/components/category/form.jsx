import React from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Button, ButtonText} from '@/components/ui/button'
import {Input, InputField} from '@/components/ui/input'
import ToggleButton from '@/components/common/toggle-button'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText
} from'@/components/ui/form-control'
import IconSelect from '@/components/common/icon-select'
import {categoryOptions} from '@/constants/categories'
import {mergeClasses} from '@/utils/css'
import {AlertTriangle} from 'lucide-react-native'
import ColorPicker, {HueSlider} from 'reanimated-color-picker';
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

const CategoryForm = ({mode, category, onSubmit, onCancel, flat}) => {
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
      color: category?.color || '#FF0000',
      icon: category?.icon || ''
    },
    resolver: zodResolver(categorySchema)
  })

  const color = watch('color')

  const handleFormSubmit = (data) => {
    const cat = {...category, ...data}
    onSubmit(cat)
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
        <FormControl isInvalid={!!formState.errors.name}>
          <FormControlLabel>
            <FormControlLabelText>Name</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="name"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                    <InputField
                        autoComplete="off"
                        autoCorrect={false}
                        enterKeyHint="done"
                        returnKeyType="done"
                        importantForAutofill="no"
                        placeholder="New Category"
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
          <FormControlLabel>
            <FormControlLabelText>Color</FormControlLabelText>
          </FormControlLabel>
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
                    <HueSlider/>
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
          <FormControlLabel>
            <FormControlLabelText>Icon</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="icon"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <IconSelect
                      flat={flat}
                      isInvalid={!!formState.errors.icon}
                      mode={mode}
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

export default CategoryForm