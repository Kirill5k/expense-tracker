import {useState} from 'react'
import {Link} from 'expo-router'
import {Keyboard} from 'react-native'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {LinkText} from '@/components/ui/link'
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
import {Button, ButtonText, ButtonIcon} from '@/components/ui/button'
import {CurrencySelect, currencies} from '@/components/settings/currency-select'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {AlertTriangle} from 'lucide-react-native'
import {GoogleIcon} from '@/assets/icons/google'

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

export const RegistrationForm = ({onSubmit, mode}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
    setError
  } = useForm({resolver: zodResolver(signUpSchema)})

  const handleFormSubmit = (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {message: 'Passwords do not match', type: 'manual'})
    }
  }

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleKeyPress = () => {
    Keyboard.dismiss()
    handleSubmit(handleFormSubmit)()
  }

  return (
      <VStack className="w-full">
        <VStack space="xl" className="w-full">
          <FormControl isInvalid={!!errors.email}>
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Controller
                name="email"
                defaultValue=""
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <Input size="sm">
                      <InputField
                          className="text-sm"
                          placeholder="Email"
                          type="text"
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
              <FormControlErrorText className="text-sm">
                {errors?.email?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>

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
                      <Input size="sm">
                        <InputField
                            className="text-sm"
                            placeholder="First Name"
                            type="text"
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
                      <Input size="sm">
                        <InputField
                            className="text-sm"
                            placeholder="Last Name"
                            type="text"
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
                defaultValue={currencies[0]}
                control={control}
                render={({field: {onChange, onBlur, value}}) => (
                    <CurrencySelect
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

          <FormControl isInvalid={!!errors.password}>
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
                          className="text-sm"
                          placeholder="Password"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={handleKeyPress}
                          returnKeyType="done"
                          type={showPassword ? "text" : "password"}
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
                    <Input size="sm">
                      <InputField
                          placeholder="Confirm Password"
                          className="text-sm"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          onSubmitEditing={handleKeyPress}
                          returnKeyType="done"
                          type={showConfirmPassword ? "text" : "password"}
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
                        size="sm"
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
        </VStack>

        <VStack className="w-full my-7" space="lg">
          <Button className="w-full" onPress={handleSubmit(handleFormSubmit)}>
            <ButtonText size="sm" className="font-medium">Sign up</ButtonText>
          </Button>
          <Button
              size="sm"
              variant="outline"
              action="secondary"
              className="w-full gap-1"
              onPress={() => {}}
          >
            <ButtonText className="font-medium">
              Continue with Google
            </ButtonText>
            <ButtonIcon as={GoogleIcon}/>
          </Button>
        </VStack>
        <HStack className="self-center" space="sm">
          <Text size="md">Already have an account?</Text>
          <Link href="/auth/signin">
            <LinkText
                className="font-medium text-primary-700 group-hover/link:text-primary-600 group-hover/pressed:text-primary-700"
                size="md"
            >
              Sign in
            </LinkText>
          </Link>
        </HStack>
      </VStack>
  )
}