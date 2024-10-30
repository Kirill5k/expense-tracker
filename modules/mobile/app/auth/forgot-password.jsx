import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {VStack} from '@/components/ui/vstack'
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Keyboard } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react-native";


const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email(),
});

const ForgotPassword = () => {

  const {
    control,
    handleSubmit,
    reset,
    formState,
  } = useForm({resolver: zodResolver(forgotPasswordSchema)});

  const onSubmit = (data) => {
    console.log(data)
    reset();
  };

  const handleKeyPress = () => {
    Keyboard.dismiss();
    handleSubmit(onSubmit)();
  };

  return (
      <ScreenLayout>
        <VStack space="md">
          <ScreenHeader
            heading="Forgot Password?"
            subHeading="Enter email ID associated with your account."
          />

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
      </ScreenLayout>
  )
}

export default ForgotPassword