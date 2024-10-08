import {Link, router} from 'expo-router'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {LinkText} from '@/components/ui/link'
import {Text} from '@/components/ui/text'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {AuthLayout} from '@/components/auth/layout'
import {LoginForm} from '@/components/auth/login'
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
      </AuthLayout>
  )
}

export default SignIn
