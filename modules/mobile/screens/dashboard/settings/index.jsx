import {useState} from 'react'
import {Box} from '@/components/ui/box'
import {Button, ButtonText} from '@/components/ui/button'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import {MaterialIcon} from '@/components/ui/icon'
import {Alert, AlertIcon, AlertText} from '@/components/ui/alert'
import Profile from '@/components/settings/profile'
import CurrencySelect from '@/components/settings/currency-select'
import ThemeSelect from '@/components/settings/theme-select'
import FutureTransactionsToggle from '@/components/settings/future-transactions-toggle'
import {SettingsAccordion, SettingsAccordionItem, SettingsAccordionContent} from '@/components/settings/accordion'
import {AccordionContentText} from '@/components/ui/accordion'
import {ProgressBar} from '@/components/common/progress'
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import useStore from '@/store'


const themeDisplayLabel = (darkMode) => {
  if (darkMode === null) return 'System'
  if (darkMode === true) return 'Dark'
  return 'Light'
}

const hideFutureTransactionsDisplayLabel = (futureTransactionVisibilityDays) => {
  if (futureTransactionVisibilityDays === 0) return 'All'
  if (!futureTransactionVisibilityDays) return 'No'
  return `${futureTransactionVisibilityDays} Days`
}


export const Settings = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    mode,
    user,
    updateUserSettings,
    logout
  } = useStore()

  const handleLogout = () => {
    setLoading(true)
    logout()
  }

  const handleUpdateSettings = (settings) => {
    setLoading(true)
    updateUserSettings(settings).then(() => setLoading(false))
  }

  if (!user) return null

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Settings
        </Heading>
        <Box>
          {isScrolling && <Divider/>}
          {loading && <ProgressBar mode={mode}/>}
        </Box>
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
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="5"
                headerTitle="Clear All Data"
            >
              <SettingsAccordionContent>
                <Alert action="error" variant="solid">
                  <AlertIcon as={MaterialIcon} code="alert-circle-outline" dcolor={Colors[mode].error} dsize={16} />
                  <AlertText size="sm">
                    This will permanently delete all your saved transactions, categories, and personal settings from the app. This action is irreversible and cannot be undone. However, your account will remain active.
                  </AlertText>
                </Alert>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="6"
                headerTitle="Close Account"
            >
              <SettingsAccordionContent>
                <Alert action="error" variant="solid">
                  <AlertIcon as={MaterialIcon} code="alert-circle-outline" dcolor={Colors[mode].error} dsize={16} />
                  <AlertText size="sm">
                    Closing your account will permanently delete your profile, transactions, categories and settings. This action cannot be undone, and you will lose access to your account.
                  </AlertText>
                </Alert>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Box className="px-5">
            <Button className="my-4 w-full" size="xs" variant="outline" action="secondary">
              <ButtonText onPress={handleLogout}>
                Sign Out
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </VStack>
  )
}
