import {useEffect} from 'react'
import {Link, router} from 'expo-router'
import {useDatabase} from '@nozbe/watermelondb/react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {LinkText} from '@/components/ui/link'
import {Text} from '@/components/ui/text'
import {AuthLayout, AuthHeader} from '@/components/auth/layout'
import {LoginForm} from '@/components/auth/login'
import {ProgressCircle} from '@/components/common/progress'
import useStore from '@/store'
import Client from '@/api/client'
import {updateStateAuthStatus} from '@/db/operations'
import {enhanceWithUser} from '@/db/observers'


const SignIn = ({user}) => {
  const database = useDatabase()
  const {setLoginSuccessAlert, mode, accessToken, setAccessToken} = useStore()

  const handleLogin = async (credentials) => {
    const {access_token} = await Client.login(credentials)
    await updateStateAuthStatus(database, access_token)
    setLoginSuccessAlert()
    setAccessToken(access_token)
  }

  useEffect(() => {
    if (user) {
      router.push('/analytics')
    }
  }, [user])

  return (
      <AuthLayout>
        {!accessToken && (
            <VStack className="md:items-center" space="md">
              <AuthHeader
                  heading="Sign In"
                  subHeading="Login to start using Expense-Tracker"
              />
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

export default enhanceWithUser(SignIn)
