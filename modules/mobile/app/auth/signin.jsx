import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {AuthLayout} from '@/components/auth/layout'
import {LoginForm} from '@/components/auth/login-form'
import useStore from '@/store'


const SignIn = () => {
  const { login } = useStore()

  return (
      <AuthLayout>
        <VStack className="md:items-center" space="md">
          <Pressable onPress={() => router.back()}>
            <Icon
                as={ArrowLeftIcon}
                className="md:hidden text-background-800"
                size="xl"
            />
          </Pressable>
          <VStack>
            <Heading className="md:text-center" size="2xl">
              Sign In
            </Heading>
            <Text>Login to start using Expense-Tracker</Text>
          </VStack>
          <LoginForm onSubmit={creds => login(creds).then(() => router.push('/'))}/>
        </VStack>
      </AuthLayout>
  )
}

export default SignIn
