import React, {useEffect} from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Link, router} from 'expo-router'
import {Text} from '@/components/ui/text'
import {LinkText} from '@/components/ui/link'
import {useColorScheme} from '@/components/useColorScheme'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {GoogleSignInButton} from '@/components/auth/google'
import {RegistrationForm} from '@/components/auth/registration'
import {ProgressCircle} from '@/components/common/progress'
import useStore from '@/store'
import Client from '@/api/client'
import {useDatabase} from '@nozbe/watermelondb/react'
import {updateStateAuthStatus} from '@/db/operations'
import {enhanceWithUser} from '@/db/observers'
import Wordings from '@/constants/text'
import Features from '@/config/features'

const SignUp = ({user}) => {
  const database = useDatabase()
  const mode = useColorScheme()
  const {setRegistrationSuccessAlert, accessToken, setAccessToken, locale} = useStore()

  const handleCreateAccount = async (account) => {
    await Client.createUser(account)
    const {access_token} = await Client.login({email: account.email, password: account.password})
    await updateStateAuthStatus(database, access_token)
    setRegistrationSuccessAlert()
    setAccessToken(access_token)
  }

  useEffect(() => {
    if (user) {
      router.push('/analytics')
    }
  }, [user])

  return (
      <ScreenLayout>
        {!accessToken && (
            <>
              <ScreenHeader
                  heading={Wordings.signupHeading}
                  subHeading={Wordings.signupSubHeading}
              />
              <RegistrationForm
                  flat
                  locale={locale}
                  mode={mode}
                  onSubmit={handleCreateAccount}
              />
              {Features.googleSignIn && <GoogleSignInButton/>}
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
            </>
        )}
        {accessToken && (
            <VStack className="w-full h-full justify-center items-center">
              <ProgressCircle mode={mode}/>
            </VStack>
        )}
      </ScreenLayout>
  )
}

export default enhanceWithUser(SignUp)