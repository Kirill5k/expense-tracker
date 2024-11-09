import React, {useState, useRef} from 'react'
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
import {Button, ButtonText, ButtonSpinner} from '@/components/ui/button'
import {Keyboard} from 'react-native'
import {useForm, Controller} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {AlertTriangle} from 'lucide-react-native'
import Colors from '@/constants/colors'


const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
  password: z.string().min(1, "Password is required"),
  rememberme: z.boolean().optional(),
})

export const LoginForm = ({onSubmit, rememberMe, passwordReset, mode}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    setError
  } = useForm({resolver: zodResolver(loginSchema)});
  const [secureTextEntry, setSecureTextEntry] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef(null)

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
                  <Input>
                    <InputField
                        autoFocus
                        autoCorrect={false}
                        autoComplete="username"
                        textContentType="username"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Your email address"
                        type="text"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={() => passwordRef.current.focus()}
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
                  <Input>
                    <InputField
                        autoCorrect={false}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        textContentType="password"
                        placeholder="Your password"
                        // autoComplete="current-password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        ref={passwordRef}
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
          {rememberMe && (
              <Controller
                  name="rememberme"
                  defaultValue={false}
                  control={control}
                  render={({field: {onChange, value}}) => (
                      <Checkbox
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
          )}
          {passwordReset && (
              <Link href="/auth/forgot-password">
                <LinkText className="font-medium text-md text-primary-700 group-hover/link:text-primary-600">
                  Forgot password?
                </LinkText>
              </Link>
          )}
        </HStack>
        <Button
            className="w-full"
            onPress={handleSubmit(handleFormSubmit)}
            isDisabled={loading}
        >
          {loading && <ButtonSpinner color={Colors[mode].background} className="pr-2" />}
          <ButtonText className="font-medium">{loading ? 'Signing you in...' : 'Sign in'}</ButtonText>
        </Button>
      </VStack>
  )
}
