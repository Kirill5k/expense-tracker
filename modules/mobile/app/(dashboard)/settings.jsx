import {useState} from 'react'
import {Box} from '@/components/ui/box'
import {Button, ButtonText} from '@/components/ui/button'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import Profile from '@/components/settings/profile'
import {CurrencySelect} from '@/components/settings/currency-select'
import ThemeSelect from '@/components/settings/theme-select'
import DeleteButton from '@/components/settings/delete-button'
import PasswordChange from '@/components/settings/password-change'
import FutureTransactionsToggle from '@/components/settings/future-transactions-toggle'
import {SettingsAccordion, SettingsAccordionItem, SettingsAccordionContent} from '@/components/settings/accordion'
import {AccordionContentText} from '@/components/ui/accordion'
import {ProgressBar} from '@/components/common/progress'
import Classes from '@/constants/classes'
import useStore from '@/store'
import {withDatabase, compose, withObservables} from '@nozbe/watermelondb/react'

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

const Settings = ({users}) => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    mode,
    updateUserSettings,
    logout,
    changeUserPassword
  } = useStore()

  const handleLogout = () => {
    setLoading(true)
    logout()
  }

  const handleUpdateSettings = (settings) => {
    setLoading(true)
    updateUserSettings(settings).then(() => setLoading(false))
  }

  const handlePasswordChange = ({password, currentPassword}) => {
    setLoading(true)
    return changeUserPassword({currentPassword, newPassword: password})
        .finally(() => setLoading(false))
  }

  if (!users) {
    return null
  }

  const user = users[0].toDomain

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Settings
        </Heading>
        {isScrolling && <Divider/>}
        {loading && <ProgressBar mode={mode}/>}
        <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        >
          <Profile user={user}/>
          <Heading className="py-2" size="xl">
            General
          </Heading>
          <SettingsAccordion
              isDisabled={loading}
          >
            <SettingsAccordionItem
                value="1"
                headerTitle="Currency"
                headerValue={user?.settings?.currency?.symbol}
            >
              <SettingsAccordionContent>
                <VStack space="sm">
                  <AccordionContentText>
                    Select your default currency for logging and viewing transactions. Existing transactions will retain
                    their original currency.
                  </AccordionContentText>
                  <CurrencySelect
                      isDisabled={loading}
                      mode={mode}
                      value={user?.settings?.currency}
                      onSelect={(currency) => {
                        handleUpdateSettings({...user.settings, currency})
                      }}
                  />
                </VStack>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="2"
                headerTitle="Hide Future Transactions"
                headerValue={hideFutureTransactionsDisplayLabel(user?.settings?.futureTransactionVisibilityDays)}
            >
              <SettingsAccordionContent>
                <FutureTransactionsToggle
                    isDisabled={loading}
                    mode={mode}
                    value={user?.settings?.futureTransactionVisibilityDays}
                    onSelect={(futureTransactionVisibilityDays) => {
                      handleUpdateSettings({...user.settings, futureTransactionVisibilityDays})
                    }}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="3"
                headerTitle="Theme"
                headerValue={themeDisplayLabel(user?.settings?.darkMode)}
            >
              <SettingsAccordionContent>
                <ThemeSelect
                    isDisabled={loading}
                    value={user?.settings?.darkMode}
                    onSelect={(darkMode) => {
                      handleUpdateSettings({...user.settings, darkMode})
                    }}
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
                    outline
                    isDisabled={loading}
                    mode={mode}
                    alertText="This will permanently delete all your saved transactions, categories, and personal settings from the app. This action is irreversible and cannot be undone. However, your account will remain active."
                    buttonText="Clear All Data"
                    confirmationText="DELETE"
                    onPress={() => console.log('clear all data')}
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
                    isDisabled={loading}
                    mode={mode}
                    alertText="Closing your account will permanently delete your profile, transactions, categories and settings. This action cannot be undone, and you will lose access to your account."
                    buttonText="Close Account"
                    confirmationText="DELETE"
                    onPress={() => console.log('close account')}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Box className="px-5">
            <Button
                isDisabled={loading}
                className="my-4 w-full"
                size="xs"
                variant="outline"
                action="secondary"
            >
              <ButtonText onPress={handleLogout}>
                Sign out
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </VStack>
  )
}

const enhance = compose(
    withDatabase,
    withObservables([], ({database}) => ({
          users: database.get('users').query().observe(),
        }),
    )
)

export default enhance(Settings)