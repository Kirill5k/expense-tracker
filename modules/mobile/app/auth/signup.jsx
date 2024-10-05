import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {router} from 'expo-router'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {AuthLayout} from '@/components/auth/layout'
import {RegistrationForm} from '@/components/auth/registration-form'


const SignUp = () => {
  return (
      <AuthLayout>
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
              Sign up
            </Heading>
            <Text>Sign up and start using Expense-Tracker</Text>
          </VStack>
          <RegistrationForm/>
        </VStack>
      </AuthLayout>
  )
}

export default SignUp