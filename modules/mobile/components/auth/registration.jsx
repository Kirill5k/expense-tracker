import React, {useState, useRef} from 'react'
import {Keyboard} from 'react-native'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'
import {Input, InputField, InputIcon, InputSlot} from '@/components/ui/input'
import {Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel} from '@/components/ui/checkbox'
import {CheckIcon, EyeIcon, EyeOffIcon} from '@/components/ui/icon'
import {Button, ButtonText, ButtonSpinner} from '@/components/ui/button'
import {CurrencySelect, getCurrencyByCode} from '@/components/settings/currency-select'
import {mergeClasses} from '@/utils/css'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {AlertTriangle} from 'lucide-react-native'
import Colors from '@/constants/colors'

const currencySchema = z.object({
  country: z.string().min(1, 'Currency country is required'),
  code: z.string().min(1, 'Currency code is required'),
  symbol: z.string().min(1, 'Currency symbol is required'),
})

const signUpSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
  firstName: z
      .string()
      .min(1, "Enter your name"),
  lastName: z
      .string()
      .min(1, "Enter your surname"),
  password: z
      .string()
      .min(6, "Must be at least 8 characters in length")
      .regex(new RegExp(".*[A-Z].*"), "One uppercase character")
      .regex(new RegExp(".*[a-z].*"), "One lowercase character")
      .regex(new RegExp(".*\\d.*"), "One number")
      .regex(new RegExp(".*[`~<>?,./!@#$%^&*()\\-_+=\"'|{}\\[\\];:\\\\].*"), "One special character"),
  currency: z.preprocess(c => c || {code: '', symbol: '', country: ''},
      currencySchema.refine((c) => c?.code && c?.symbol, {message: 'Please select default currency'})),
  confirmPassword: z
      .string()
      .min(6, "Must be at least 8 characters in length")
      .regex(new RegExp(".*[A-Z].*"), "One uppercase character")
      .regex(new RegExp(".*[a-z].*"), "One lowercase character")
      .regex(new RegExp(".*\\d.*"), "One number")
      .regex(new RegExp(".*[`~<>?,./!@#$%^&*()\\-_+=\"'|{}\\[\\];:\\\\].*"), "One special character"),
  acceptTerms: z.boolean().refine(v => v, {message: 'You must accept the terms and conditions'})
})

export const RegistrationForm = ({onSubmit, mode, locale, flat = false}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
    setError
  } = useForm({resolver: zodResolver(signUpSchema)})
  const emailRef = useRef(null)
  const firstNameRef = useRef(null)
  const lastNameRef = useRef(null)
  const passwordRef = useRef(null)
  const currencySelRef = useRef(null)
  const confirmPasswordRef = useRef(null)

  const handleFormSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {message: 'Passwords do not match', type: 'manual'})
    } else {
      setLoading(true)
      onSubmit(data)
          .then(() => reset())
          .catch(e => setError('email', {message: e.message, type: 'manual'}))
          .finally(() => setLoading(false))
    }
  }

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleKeyPress = () => {
    if (!loading) {
      Keyboard.dismiss()
    }
  }

  return (
      <VStack space="xl" className="w-full">
        <HStack className="w-full flex-row" space="md">
          <FormControl isInvalid={!!errors.firstName} className="flex-1">
            <FormControlLabel>
              <FormControlLabelText>First Name</FormControlLabelText>
            </FormControlLabel>
            <Controller
                name="firstName"
                defaultValue=""
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                      <InputField
                          autoFocus
                          autoCorrect={false}
                          inputMode="text"
                          autoCapitalize="words"
                          textContentType="givenName"
                          placeholder="First name"
                          type="text"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={() => lastNameRef.current.focus()}
                          returnKeyType="next"
                          ref={firstNameRef}
                      />
                    </Input>
                )}
            />
            <FormControlError>
              <FormControlErrorIcon size="sm" as={AlertTriangle}/>
              <FormControlErrorText className="text-sm">
                {errors?.firstName?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.lastName} className="flex-1">
            <FormControlLabel>
              <FormControlLabelText>Last Name</FormControlLabelText>
            </FormControlLabel>
            <Controller
                name="lastName"
                defaultValue=""
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                      <InputField
                          autoCorrect={false}
                          inputMode="text"
                          textContentType="familyName"
                          autoCapitalize="words"
                          placeholder="Last name"
                          type="text"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={() => currencySelRef.current.focus()}
                          returnKeyType="next"
                          ref={lastNameRef}
                      />
                    </Input>
                )}
            />
            <FormControlError>
              <FormControlErrorIcon size="sm" as={AlertTriangle}/>
              <FormControlErrorText className="text-sm">
                {errors?.lastName?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>

        </HStack>

        <FormControl isInvalid={!!errors.currency}>
          <FormControlLabel>
            <FormControlLabelText>Default Currency</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="currency"
              defaultValue={getCurrencyByCode(locale.currencyCode, 'USD')}
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <CurrencySelect
                      flat={flat}
                      ref={currencySelRef}
                      mode={mode}
                      value={value}
                      onSelect={onChange}
                  />
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {errors?.currency?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!errors.email}>
          <FormControlLabel>
            <FormControlLabelText>Email</FormControlLabelText>
          </FormControlLabel>
          <Controller
              name="email"
              defaultValue=""
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                    <InputField
                        autoCorrect={false}
                        spellCheck={false}
                        inputMode="email"
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
                        ref={emailRef}
                    />
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {errors?.email?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormControlLabel>
            <FormControlLabelText>Password</FormControlLabelText>
          </FormControlLabel>
          <Controller
              defaultValue=""
              name="password"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                    <InputField
                        autoCorrect={false}
                        textContentType="newPassword"
                        passwordrules="minlength: 20; required: lower; required: upper; required: digit; required: [$@];"
                        placeholder="Create a password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={() => confirmPasswordRef.current.focus()}
                        returnKeyType="next"
                        type={showPassword ? "text" : "password"}
                        ref={passwordRef}
                    />
                    <InputSlot onPress={() => setShowPassword((s) => !s)} className="pr-3">
                      <InputIcon as={showPassword ? EyeIcon : EyeOffIcon}/>
                    </InputSlot>
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {errors?.password?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormControlLabel>
            <FormControlLabelText>Confirm Password</FormControlLabelText>
          </FormControlLabel>
          <Controller
              defaultValue=""
              name="confirmPassword"
              control={control}
              render={({field: {onChange, onBlur, value}}) => (
                  <Input className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
                    <InputField
                        autoCorrect={false}
                        textContentType="newPassword"
                        passwordrules="minlength: 20; required: lower; required: upper; required: digit; required: [$@];"
                        placeholder="Re-enter your password"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={handleKeyPress}
                        returnKeyType="done"
                        type={showConfirmPassword ? "text" : "password"}
                        ref={confirmPasswordRef}
                    />

                    <InputSlot onPress={() => setShowConfirmPassword(s => !s)} className="pr-3">
                      <InputIcon as={showConfirmPassword ? EyeIcon : EyeOffIcon}/>
                    </InputSlot>
                  </Input>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {errors?.confirmPassword?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>

        <FormControl isInvalid={!!errors.acceptTerms}>
          <Controller
              name="acceptTerms"
              defaultValue={false}
              control={control}
              render={({field: {onChange, value}}) => (
                  <Checkbox
                      value="accepterTerms"
                      isChecked={value}
                      onChange={onChange}
                      aria-label="Accept Terms and Conditions"
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon}/>
                    </CheckboxIndicator>
                    <CheckboxLabel>
                      I accept the Terms of Use & Privacy Policy
                    </CheckboxLabel>
                  </Checkbox>
              )}
          />
          <FormControlError>
            <FormControlErrorIcon size="sm" as={AlertTriangle}/>
            <FormControlErrorText className="text-sm">
              {errors?.acceptTerms?.message}
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
        <Button
            className="w-full"
            onPress={handleSubmit(handleFormSubmit)}
            isDisabled={loading}
        >
          {loading && <ButtonSpinner color={Colors[mode].background} className="pr-2"/>}
          <ButtonText className="font-medium">{loading ? 'Creating an account...' : 'Sign up'}</ButtonText>
        </Button>
      </VStack>
  )
}