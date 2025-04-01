import React, {useState} from 'react'
import {Keyboard} from 'react-native'
import {AlertTriangle} from 'lucide-react-native'
import {EyeIcon, EyeOffIcon} from '@/components/ui/icon'
import {VStack} from '@/components/ui/vstack'
import {Button, ButtonText} from '@/components/ui/button'
import {Input, InputField, InputSlot, InputIcon} from '@/components/ui/input'
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlError
} from '@/components/ui/form-control'
import {BlurredBackground} from '@/components/common/blur'
import {mergeClasses} from '@/utils/css'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z
      .string()
      .min(6, "Enter your current password"),
  password: z
      .string()
      .min(8, "Must be at least 8 characters in length")
      .regex(new RegExp(".*[A-Z].*"), "One uppercase character")
      .regex(new RegExp(".*[a-z].*"), "One lowercase character")
      .regex(new RegExp(".*\\d.*"), "One number")
      .regex(
          new RegExp(".*[`~<>?,./!@#$%^&*()\\-_+=\"'|{}\\[\\];:\\\\].*"),
          "One special character"
      ),
  confirmPassword: z
      .string()
      .min(8, "Must be at least 8 characters in length")
      .regex(new RegExp(".*[A-Z].*"), "One uppercase character")
      .regex(new RegExp(".*[a-z].*"), "One lowercase character")
      .regex(new RegExp(".*\\d.*"), "One number")
      .regex(
          new RegExp(".*[`~<>?,./!@#$%^&*()\\-_+=\"'|{}\\[\\];:\\\\].*"),
          "One special character"
      ),
})

const PasswordChange = ({onSubmit, blurred = false}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState,
    setError,
  } = useForm({resolver: zodResolver(changePasswordSchema)})

  const handleFormSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {message: 'Passwords do not match', type: 'manual'})
    } else if (data.currentPassword === data.password) {
      setError('password', {message: 'The new password cannot be the same as the old password', type: 'manual'})
    } else {
      onSubmit(data)
          .then(() => reset())
          .catch(e => setError('currentPassword', {message: e.message, type: 'manual'}))
    }
  }

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(handleFormSubmit)();
  }

  return (
      <VStack space="md" className="w-full">
        <FormControl isInvalid={!!formState.errors?.currentPassword}>
          <FormControlLabel>
            <FormControlLabelText className="text-sm">Current Password</FormControlLabelText>
          </FormControlLabel>
          <Controller
              defaultValue=""
              name="currentPassword"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input size="md" className={mergeClasses(blurred && 'border-0')}>
                    {blurred && <BlurredBackground borderRadius={6} rounded/>}
                    <InputField
                        className="text-md"
                        placeholder="Current Password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        type={showCurrentPassword ? "text" : "password"}
                    />
                    <InputSlot onPress={() => setShowCurrentPassword(!showCurrentPassword)} className="pr-3">
                      <InputIcon as={showCurrentPassword ? EyeIcon : EyeOffIcon}/>
                    </InputSlot>
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {formState.errors?.currentPassword?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <FormControl isInvalid={!!formState.errors?.password}>
          <FormControlLabel>
            <FormControlLabelText className="text-sm">New Password</FormControlLabelText>
          </FormControlLabel>
          <Controller
              defaultValue=""
              name="password"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input size="md" className={mergeClasses(blurred && 'border-0')}>
                    {blurred && <BlurredBackground borderRadius={6} rounded/>}
                    <InputField
                        className="text-md"
                        placeholder="Password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        type={showPassword ? "text" : "password"}
                    />
                    <InputSlot onPress={() => setShowPassword(!showPassword)} className="pr-3">
                      <InputIcon as={showPassword ? EyeIcon : EyeOffIcon}/>
                    </InputSlot>
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {formState.errors?.password?.message}
            </FormControlErrorText>
          </FormControlError>
          <FormControlLabel>
            <FormControlLabelText className="text-xs text-typography-500">
              Must be at least 8 characters
            </FormControlLabelText>
          </FormControlLabel>
        </FormControl>
        <FormControl isInvalid={!!formState.errors?.confirmPassword}>
          <FormControlLabel>
            <FormControlLabelText className="text-sm">Confirm Password</FormControlLabelText>
          </FormControlLabel>
          <Controller
              defaultValue=""
              name="confirmPassword"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input size="md" className={mergeClasses(blurred && 'border-0')}>
                    {blurred && <BlurredBackground borderRadius={6} rounded/>}
                    <InputField
                        placeholder="Confirm Password"
                        className="text-md"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        type={showConfirmPassword ? "text" : "password"}
                    />

                    <InputSlot onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-3">
                      <InputIcon
                          as={showConfirmPassword ? EyeIcon : EyeOffIcon}
                      />
                    </InputSlot>
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {formState.errors?.confirmPassword?.message}
            </FormControlErrorText>
          </FormControlError>
          <FormControlLabel>
            <FormControlLabelText className="text-xs text-typography-500">
              Both passwords must match
            </FormControlLabelText>
          </FormControlLabel>
        </FormControl>

        <Button size="md" className="w-full" onPress={handleSubmit(handleFormSubmit)}>
          <ButtonText className="font-medium">Change Password</ButtonText>
        </Button>
      </VStack>
  )
}

export default PasswordChange
