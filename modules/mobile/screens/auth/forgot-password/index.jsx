import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { ArrowLeftIcon, Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { Keyboard } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { AuthLayout } from "../layout";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
});

const ForgotPasswordScreen = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState,
  } = useForm({resolver: zodResolver(forgotPasswordSchema)});
  const toast = useToast();

  const onSubmit = (_data) => {
    toast.show({
      placement: "bottom right",
      render: ({ id }) => {
        return (
            <Toast nativeID={id} variant="accent" action="success">
              <ToastTitle>Link Sent Successfully</ToastTitle>
            </Toast>
        );
      },
    });
    reset();
  };

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(onSubmit)();
  };
  return (
      <VStack className="max-w-[440px] w-full" space="md">
        <VStack className="md:items-center" space="md">
          <Pressable onPress={() => router.back()}>
            <Icon
                as={ArrowLeftIcon}
                className="md:hidden stroke-background-800"
                size="xl"
            />
          </Pressable>
          <VStack>
            <Heading className="md:text-center" size="3xl">
              Forgot Password?
            </Heading>
            <Text className="text-sm">
              Enter email ID associated with your account.
            </Text>
          </VStack>
        </VStack>

        <VStack space="xl" className="w-full ">
          <FormControl isInvalid={!!formState.errors?.email} className="w-full">
            <FormControlLabel>
              <FormControlLabelText>Email</FormControlLabelText>
            </FormControlLabel>
            <Controller
                defaultValue=""
                name="email"
                control={control}
                rules={{
                  validate: email => forgotPasswordSchema.parseAsync({ email })
                      .then(() => true)
                      .catch(e => e.message)
                }}
                render={({ field: { onChange, onBlur, value } }) => (
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
              <FormControlErrorIcon as={AlertTriangle} />
              <FormControlErrorText>
                {formState.errors?.email?.message}
              </FormControlErrorText>
            </FormControlError>
          </FormControl>
          <Button className="w-full" onPress={handleSubmit(onSubmit)}>
            <ButtonText className="font-medium">Send Link</ButtonText>
          </Button>
        </VStack>
      </VStack>
  );
};

export const ForgotPassword = () => {
  return (
      <AuthLayout>
        <ForgotPasswordScreen />
      </AuthLayout>
  );
};