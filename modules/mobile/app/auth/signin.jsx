import {useState, useEffect} from 'react'
import {Link, router} from 'expo-router'
import {useDatabase} from '@nozbe/watermelondb/react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {LinkText} from '@/components/ui/link'
import {Text} from '@/components/ui/text'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {AuthLayout} from '@/components/auth/layout'
import {LoginForm} from '@/components/auth/login'
import {ProgressCircle} from '@/components/common/progress'
import useStore from '@/store'
import Client from '@/store/client'
import {updateStateAuthStatus, saveUser, saveCategories, saveTransactions} from '@/db/operations'


const SignIn = () => {
  const [accessToken, setAccessToken] = useState(null)
  const database = useDatabase()
  const {setLoginSuccessAlert, mode} = useStore()

  const handleLogin = async (credentials) => {
    const {access_token} = await Client.login(credentials)
    await updateStateAuthStatus(database, access_token)
    setLoginSuccessAlert()
    setAccessToken(access_token)
  }

  useEffect(() => {
    const fetchData = async () => {
      const user = await Client.getUser(accessToken)
      await saveUser(database, user)
      await saveCategories(database, user.id, user.categories)
      const transactions = await Client.getTransactions(accessToken)
      await saveTransactions(database, user.id, transactions)
      router.push('/analytics')
    }

    if (accessToken) {
      fetchData()
    }
  }, [accessToken]);

  return (
      <AuthLayout>
        {!accessToken && (
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
              <LoginForm onSubmit={handleLogin}/>
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
        )}
        {accessToken && (
            <VStack className="w-full h-full justify-center items-center">
              <ProgressCircle mode={mode}/>
            </VStack>
        )}
      </AuthLayout>
  )
}

export default SignIn
