import React, {useState, useEffect} from 'react'
import {router} from 'expo-router'
import {Platform} from 'react-native'
import {ScreenHeading} from '@/components/common/layout'
import {Box} from '@/components/ui/box'
import {Button, ButtonText} from '@/components/ui/button'
import {Heading} from '@/components/ui/heading'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import {KeyboardAvoidingView} from '@/components/ui/keyboard-avoiding-view'
import Profile from '@/components/settings/profile'
import {CurrencySelect} from '@/components/settings/currency-select'
import ThemeSelect from '@/components/settings/theme-select'
import DeleteButton from '@/components/settings/delete-button'
import PasswordChange from '@/components/settings/password-change'
import FutureTransactionsToggle from '@/components/settings/future-transactions-toggle'
import {SettingsAccordion, SettingsAccordionItem, SettingsAccordionContent} from '@/components/settings/accordion'
import {AccordionContentText} from '@/components/ui/accordion'
import Classes from '@/constants/classes'
import Client from '@/api/client'
import {useColorScheme} from '@/components/useColorScheme'
import useStore from '@/store'
import {useDatabase} from '@nozbe/watermelondb/react'
import {enhanceWithUserAndTxCount} from '@/db/observers'
import {
  updateUserFutureTransactionVisibilityDays,
  updateUserDarkMode,
  updateUserCurrency,
  resetState,
  updateStateAuthStatus,
  deleteData
} from '@/db/operations'

const themeDisplayLabel = (darkMode) => {
  if (darkMode === null) {
    return 'System'
  }
  if (darkMode === true) {
    return 'Dark'
  }
  return 'Light'
}

const hideFutureTransactionsDisplayLabel = (futureTransactionVisibilityDays) => {
  if (futureTransactionVisibilityDays === 0) {
    return 'All'
  }
  if (!futureTransactionVisibilityDays) {
    return 'No'
  }
  return `${futureTransactionVisibilityDays} Days`
}

const Settings = ({user, state, totalTransactionCount}) => {
  const mode = useColorScheme()
  const database = useDatabase()
  const {setMode, clearAccessToken, setErrorAlert, setPasswordChangeSuccessAlert, setDataDeletionSuccessAlert} = useStore()

  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    setLoading(true)
    clearAccessToken()
    return resetState(database)
        .then(() => {
          setLoading(false)
          router.push('/')
        })
  }

  const handleModeChange = (darkMode) => {
    setLoading(true)
    updateUserDarkMode(database, user.id, darkMode)
        .then(() => {
          if (darkMode === false) {
            setMode('light')
          } else if (darkMode === true) {
            setMode('dark')
          } else {
            setMode('system')
          }
        })
        .finally(() => setLoading(false))
  }

  const handlePasswordChange = ({password, currentPassword}) => {
    setLoading(true)
    return Client
        .changeUserPassword(state.accessToken, state.userId, {currentPassword, newPassword: password})
        .then(() => Client.login({email: user.email, password}))
        .then(({access_token}) => updateStateAuthStatus(database, access_token))
        .then(() => setPasswordChangeSuccessAlert())
        .catch(e => setErrorAlert(`Failed to reset the password: ${e}`))
        .finally(() => setLoading(false))
  }

  const handleUserDelete = () => {
    setLoading(true)
    return Client
        .deleteUser(state.accessToken)
        .then(handleLogout)
        .catch(e => setErrorAlert(`Failed to delete the account: ${e}`))
        .finally(() => setLoading(false))
  }

  const handleUserDataDelete = () => {
    setLoading(true)
    return Client
        .deleteUserData(state.accessToken)
        .then(() => deleteData(database))
        .then(() => setDataDeletionSuccessAlert())
        .catch(e => setErrorAlert(`Failed to delete the data: ${e}`))
        .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      handleLogout()
    }
  }, [])

  return (
      <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full h-full bg-transparent"
          keyboardVerticalOffset={20}
      >
      <VStack className={Classes.dashboardLayout}>
        <ScreenHeading
            heading="Settings"
            loading={loading}
        />
        <ScrollView
            bounces={true}
            showsVerticalScrollIndicator={false}
        >
          <Profile user={{...user.toDomain, totalTransactionCount}}/>
          <Heading className="py-2" size="xl">
            General
          </Heading>
          <SettingsAccordion
              isDisabled={loading}
          >
            <SettingsAccordionItem
                value="1"
                headerTitle="Currency"
                headerValue={user?.currency?.symbol}
            >
              <SettingsAccordionContent>
                <VStack space="lg">
                  <AccordionContentText>
                    Select your default currency for logging and viewing transactions. Existing transactions will retain
                    their original currency.
                  </AccordionContentText>
                  <CurrencySelect
                      blurred
                      size="md"
                      isDisabled={loading}
                      mode={mode}
                      value={user?.currency}
                      onSelect={(currency) => {
                        updateUserCurrency(database, user.id, currency)
                      }}
                  />
                </VStack>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="2"
                headerTitle="Hide Future Transactions"
                headerValue={hideFutureTransactionsDisplayLabel(user?.settingsFutureTransactionVisibilityDays)}
            >
              <SettingsAccordionContent>
                <FutureTransactionsToggle
                    isDisabled={loading}
                    mode={mode}
                    value={user?.settingsFutureTransactionVisibilityDays}
                    onSelect={(futureTransactionVisibilityDays) => {
                      updateUserFutureTransactionVisibilityDays(database, user.id, futureTransactionVisibilityDays)
                    }}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="3"
                headerTitle="Theme"
                headerValue={themeDisplayLabel(user?.settingsDarkMode)}
            >
              <SettingsAccordionContent>
                <ThemeSelect
                    isDisabled={loading}
                    value={user?.settingsDarkMode}
                    onSelect={handleModeChange}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Heading className="py-2" size="xl">
            Security
          </Heading>
          <SettingsAccordion
              isDisabled={loading}
          >
            <SettingsAccordionItem
                value="4"
                headerTitle="Change Password"
            >
              <SettingsAccordionContent>
                <PasswordChange
                    blurred
                    onSubmit={handlePasswordChange}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="5"
                headerTitle="Clear All Data"
            >
              <SettingsAccordionContent>
                <DeleteButton
                    blurred
                    outline
                    isDisabled={loading}
                    mode={mode}
                    alertText="This will permanently delete all your saved transactions and categories from the app. This action is irreversible and cannot be undone. However, your account will remain active."
                    buttonText="Clear All Data"
                    confirmationText="DELETE"
                    onPress={handleUserDataDelete}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="6"
                headerTitle="Close Account"
            >
              <SettingsAccordionContent>
                <DeleteButton
                    blurred
                    isDisabled={loading}
                    mode={mode}
                    alertText="Closing your account will permanently delete your profile, transactions, categories and settings. This action cannot be undone, and you will lose access to your account."
                    buttonText="Close Account"
                    confirmationText="DELETE"
                    onPress={handleUserDelete}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Box className="px-5 mb-6">
            <Button
                variant="outline"
                isDisabled={loading}
                className="my-4 w-full"
                size="md"
                action="primary"
                onPress={handleLogout}
            >
              <ButtonText>
                Sign out
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </VStack>
      </KeyboardAvoidingView>
  )
}

export default enhanceWithUserAndTxCount(Settings)