import React, {useState} from "react";
import colors from "tailwindcss/colors";
import {HStack} from "@/components/ui/hstack";
import {VStack} from "@/components/ui/vstack";
import {Heading} from "@/components/ui/heading";
import {Text} from "@/components/ui/text";
import {LinkText} from "@/components/ui/link";
import {Link, router} from 'expo-router';
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import {Input, InputField, InputIcon, InputSlot} from "@/components/ui/input";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  Icon,
} from "@/components/ui/icon";
import {Button, ButtonText, ButtonIcon, ButtonSpinner} from "@/components/ui/button";
import {Keyboard} from "react-native";
import {useForm, Controller} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {AlertTriangle} from "lucide-react-native";
import {GoogleIcon} from "@/assets/icons/google";
import {Pressable} from "@/components/ui/pressable";
import {AuthLayout} from "../layout";
import useStore from "@/store";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
  password: z.string().min(1, "Password is required"),
  rememberme: z.boolean().optional(),
});

const LoginForm = ({onSubmit}) => {
  const {control, handleSubmit, reset, formState} = useForm({resolver: zodResolver(loginSchema)});
  const [loginError, setLoginError] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = (data) => {
    setLoading(true)
    setLoginError('')
    onSubmit(data)
        .then(() => reset())
        .catch(e => setLoginError(e.message))
        .finally(() => setLoading(false))
  }

  const handleKeyPress = () => {
    if (!loading) {
      Keyboard.dismiss();
      handleSubmit(handleFormSubmit)();
    }
  };

  return (
      <VStack className="max-w-[440px] w-full" space="md">
        <VStack className="md:items-center" space="md">
          <Pressable onPress={() => router.back()}>
            <Icon
                as={ArrowLeftIcon}
                className="md:hidden text-background-800"
                size="xl"
            />
          </Pressable>
          <VStack>
            <Heading className="md:text-center" size="3xl">
              Log in
            </Heading>
            <Text>Login to start using Expense-Tracker</Text>
          </VStack>
        </VStack>
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
                  rules={{
                    validate: (email) => loginSchema.parseAsync({email})
                        .then(() => true)
                        .catch((e) => e.message)
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                      <Input>
                        <InputField
                            placeholder="Enter email"
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
                <FormControlErrorIcon as={AlertTriangle}/>
                <FormControlErrorText>
                  {formState.errors?.email?.message}
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
            <FormControl
                isInvalid={!!formState.errors.password || !!loginError}
                className="w-full"
            >
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Controller
                  defaultValue=""
                  name="password"
                  control={control}
                  rules={{
                    validate: password => loginSchema.parseAsync({password})
                        .then(() => true)
                        .catch(e => e.message)
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                      <Input>
                        <InputField
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
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
                <FormControlErrorIcon as={AlertTriangle}/>
                <FormControlErrorText>
                  {formState.errors?.password?.message || loginError}
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
                  Forgot Password?
                </LinkText>
              </Link>
            </HStack>
          </VStack>
          <VStack className="w-full my-7 " space="lg">
            <Button className="w-full" onPress={handleSubmit(handleFormSubmit)} isDisabled={loading}>
              {loading && <ButtonSpinner color={colors.gray[400]} />}
              <ButtonText className="font-medium">{loading ? 'Logging you in...' : 'Log in'}</ButtonText>
            </Button>
            <Button
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
          <HStack className="self-center" space="sm">
            <Text size="md">Don't have an account?</Text>
            <Link href="/auth/signup">
              <LinkText
                  className="font-medium text-primary-700 group-hover/link:text-primary-600  group-hover/pressed:text-primary-700"
                  size="md"
              >
                Sign up
              </LinkText>
            </Link>
          </HStack>
        </VStack>
      </VStack>
  );
};

export const SignIn = () => {
  const { login } = useStore();

  return (
      <AuthLayout>
        <LoginForm onSubmit={creds => login(creds).then(() => router.push('/'))}/>
      </AuthLayout>
  );
};