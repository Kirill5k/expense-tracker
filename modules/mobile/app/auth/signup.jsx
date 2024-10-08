import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Heading} from '@/components/ui/heading'
import {Link, router} from 'expo-router'
import {Text} from '@/components/ui/text'
import {LinkText} from '@/components/ui/link'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {AuthLayout} from '@/components/auth/layout'
import {RegistrationForm} from '@/components/auth/registration'
import useStore from '@/store'


const SignUp = () => {
  const { mode, createAccount } = useStore()

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
              Sign Up
            </Heading>
            <Text>Create an account and start using Expense-Tracker</Text>
          </VStack>
          <RegistrationForm
              mode={mode}
              onSubmit={(acc) => createAccount(acc).then(() => router.push('/'))}
          />
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
      </AuthLayout>
  )
}

export default SignUp