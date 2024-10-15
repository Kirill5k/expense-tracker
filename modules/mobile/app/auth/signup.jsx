import {useEffect, useState} from 'react'
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
import {ProgressCircle} from '@/components/common/progress'
import useStore from '@/store'
import Client from '@/api/client'
import {useDatabase} from '@nozbe/watermelondb/react'
import {updateStateAuthStatus, saveUser, saveCategories, saveTransactions} from '@/db/operations'


const SignUp = () => {
  const [accessToken, setAccessToken] = useState(null)
  const database = useDatabase()
  const {setRegistrationSuccessAlert, mode} = useStore()

  const handleCreateAccount = async (account) => {
    await Client.createUser(account)
    const {access_token} = await Client.login({email: account.email, password: account.password})
    await updateStateAuthStatus(database, access_token)
    setRegistrationSuccessAlert()
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
                  onSubmit={handleCreateAccount}
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
        )}
        {accessToken && (
            <VStack className="w-full h-full justify-center items-center">
              <ProgressCircle mode={mode}/>
            </VStack>
        )}
      </AuthLayout>
  )
}

export default SignUp