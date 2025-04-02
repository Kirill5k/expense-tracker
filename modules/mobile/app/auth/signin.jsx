import {Link} from 'expo-router'
import {useDatabase} from '@nozbe/watermelondb/react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {LinkText} from '@/components/ui/link'
import {Text} from '@/components/ui/text'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {LoginForm} from '@/components/auth/login'
import {ProgressCircle} from '@/components/common/progress'
import {GoogleSignInButton} from '@/components/auth/google'
import useStore from '@/store'
import Client from '@/api/client'
import {updateStateAuthStatus} from '@/db/operations'
import {useColorScheme} from '@/components/useColorScheme'
import Wordings from '@/constants/text'
import Features from '@/config/features'


const SignIn = () => {
  const database = useDatabase()
  const mode = useColorScheme()
  const {setLoginSuccessAlert, accessToken, setAccessToken} = useStore()

  const handleLogin = async (credentials) => {
    const {access_token} = await Client.login(credentials)
    await updateStateAuthStatus(database, access_token)
    setLoginSuccessAlert()
    setAccessToken(access_token)
  }

  return (
      <ScreenLayout>
        {!accessToken && (
            <VStack space="md">
              <ScreenHeader
                  heading={Wordings.signinHeading}
                  subHeading={Wordings.signinSubHeading}
              />
              <LoginForm
                  blurred
                  passwordReset={Features.passwordReset}
                  rememberMe={Features.rememberMe}
                  onSubmit={handleLogin}
                  mode={mode}
              />
              {Features.googleSignIn && <GoogleSignInButton/>}
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
      </ScreenLayout>
  )
}

export default SignIn
