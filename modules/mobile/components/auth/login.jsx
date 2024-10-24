import React, {useState} from 'react'
import colors from 'tailwindcss/colors'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {LinkText} from '@/components/ui/link'
import {Link} from 'expo-router'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'
import {Input, InputField, InputIcon, InputSlot} from '@/components/ui/input'
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from '@/components/ui/checkbox'
import {CheckIcon, EyeIcon, EyeOffIcon} from '@/components/ui/icon'
import {Button, ButtonText, ButtonIcon, ButtonSpinner} from '@/components/ui/button'
import {Keyboard} from 'react-native'
import {useForm, Controller} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {AlertTriangle} from 'lucide-react-native'
import {GoogleIcon} from '@/assets/icons/google'


const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
  password: z.string().min(1, "Password is required"),
  rememberme: z.boolean().optional(),
})

export const LoginForm = ({onSubmit}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    setError
  } = useForm({resolver: zodResolver(loginSchema)});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = (data) => {
    setLoading(true)
    onSubmit(data)
        .then(() => reset())
        .catch(e => setError('password', {message: e.message, type: 'manual'}))
        .finally(() => setLoading(false))
  }

  const handleKeyPress = () => {
    if (!loading) {
      Keyboard.dismiss()
      handleSubmit(handleFormSubmit)()
    }
  }

  return (
      <VStack className="w-full">
        <VStack space="xl" className="w-full">
          <FormControl
              isInvalid={!!formState.errors?.email}
              className="w-full"
          >
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Controller
                defaultValue=""
                name="email"
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <Input size="sm">
                      <InputField
                          autoComplete="email"
                          textContentType="emailAddress"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholder="Email"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={handleKeyPress}
                          returnKeyType="next"
                      />
                    </Input>
                )}
            />
            <FormControlError>
              <FormControlErrorIcon as={AlertTriangle} size="sm"/>
              <FormControlErrorText className="text-sm">
                {formState.errors?.email?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
          <FormControl
              isInvalid={!!formState.errors.password}
              className="w-full"
          >
            <FormControlLabel>
              <FormControlLabelText>Password</FormControlLabelText>
            </FormControlLabel>
            <Controller
                defaultValue=""
                name="password"
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <Input size="sm">
                      <InputField
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={handleKeyPress}
                          returnKeyType="done"
                      />
                      <InputSlot onPress={() => setShowPassword((s) => !s)} className="pr-3">
                        <InputIcon as={showPassword ? EyeIcon : EyeOffIcon}/>
                      </InputSlot>
                    </Input>
                )}
            />
            <FormControlError>
              <FormControlErrorIcon as={AlertTriangle} size="sm"/>
              <FormControlErrorText className="text-sm">
                {formState.errors?.password?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
          <HStack className="w-full justify-between">
            <Controller
                name="rememberme"
                defaultValue={false}
                control={control}
                render={({field: {onChange, value}}) => (
                    <Checkbox
                        size="sm"
                        value="Remember me"
                        isChecked={value}
                        onChange={onChange}
                        aria-label="Remember me"
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon}/>
                      </CheckboxIndicator>
                      <CheckboxLabel>Remember me</CheckboxLabel>
                    </Checkbox>
                )}
            />
            <Link href="/auth/forgot-password">
              <LinkText className="font-medium text-sm text-primary-700 group-hover/link:text-primary-600">
                Forgot password?
              </LinkText>
            </Link>
          </HStack>
        </VStack>
        <VStack className="w-full my-7 " space="lg">
          <Button
              size="sm"
              className="w-full"
              onPress={handleSubmit(handleFormSubmit)}
              isDisabled={loading}
          >
            {loading && <ButtonSpinner color={colors.gray[400]} className="pr-2" />}
            <ButtonText className="font-medium">{loading ? 'Signing you in...' : 'Sign in'}</ButtonText>
          </Button>
          <Button
              size="sm"
              variant="outline"
              action="secondary"
              className="w-full gap-1"
              onPress={() => {}}>
            <ButtonText className="font-medium">
              Continue with Google
            </ButtonText>
            <ButtonIcon as={GoogleIcon}/>
          </Button>
        </VStack>
      </VStack>
  )
}
