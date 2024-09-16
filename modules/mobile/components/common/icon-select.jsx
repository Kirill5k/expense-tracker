import React from 'react'
import {ScrollView} from '@/components/ui/scroll-view'
import {Pressable} from '@/components/ui/pressable'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Divider} from '@/components/ui/divider'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'

const iconGroups = {
  'Banking': [
    'mdi-bank-transfer',
    'mdi-bank-transfer-in',
    'mdi-bank-transfer-out',
    'mdi-account-cash',
    'mdi-credit-card',
    'mdi-bank',
    'mdi-cash',
    'mdi-chart-areaspline',
    'mdi-finance',
    'mdi-piggy-bank',
    'mdi-safe',
    'mdi-wallet',
    'mdi-send',
    'mdi-currency-eur',
    'mdi-currency-gbp',
    'mdi-currency-usd',
    'mdi-bitcoin',
  ],
  'Entertainment': [
    'mdi-camera',
    'mdi-cellphone',
    'mdi-guitar-acoustic',
    'mdi-headphones',
    'mdi-microphone',
    'mdi-monitor',
    'mdi-music',
    'mdi-piano',
    'mdi-tablet',
    'mdi-television',
    'mdi-controller',
    'mdi-watch',
  ],
  'Food, drink': [
    'mdi-beer',
    'mdi-bottle-soda',
    'mdi-bowl-mix',
    'mdi-coffee',
    'mdi-cookie',
    'mdi-cup',
    'mdi-cupcake',
    'mdi-fish',
    'mdi-food-fork-drink',
    'mdi-glass-cocktail',
    'mdi-grill',
    'mdi-silverware',
    'mdi-hamburger',
    'mdi-pizza',
  ],
  'Holiday': [
    'mdi-bed-double',
    'mdi-cake',
    'mdi-coffin',
    'mdi-firework',
    'mdi-food-turkey',
    'mdi-gift',
    'mdi-halloween',
    'mdi-party-popper',
    'mdi-pine-tree',
    'mdi-snowflake',
  ],
  'Household': [
    'mdi-antenna',
    'mdi-water',
    'mdi-flash',
    'mdi-fire',
    'mdi-home',
    'mdi-lightbulb',
    'mdi-umbrella',
    'mdi-water-pump',
    'mdi-web',
    'mdi-wifi',
    'mdi-baby-carriage',
    'mdi-shield-car',
    'mdi-garage',
    'mdi-cog',
    'mdi-wrench',
    'mdi-hammer',
  ],
  'Shopping': [
    'mdi-basket',
    'mdi-hanger',
    'mdi-cart',
    'mdi-cash-register',
    'mdi-shopping',
    'mdi-store',
    'mdi-wallet-giftcard',
    'mdi-pill',
    'mdi-tag',
  ],
  'Sport': [
    'mdi-basketball',
    'mdi-bike',
    'mdi-bowling',
    'mdi-dumbbell',
    'mdi-run',
    'mdi-soccer',
    'mdi-tennis',
    'mdi-trophy',
    'mdi-yoga',
  ],
  'Transport, travel': [
    'mdi-ticket',
    'mdi-airplane',
    'mdi-ambulance',
    'mdi-bag-carry-on',
    'mdi-bag-suitcase',
    'mdi-bus',
    'mdi-car',
    'mdi-rocket',
    'mdi-train',
    'mdi-tram',
    'mdi-walk',
    'mdi-van-passenger',
    'mdi-van-utility',
    'mdi-gas-station',
    'mdi-taxi',
    'mdi-palm-tree',
  ]
}

const IconSelect = ({value, onChange, valueColor}) => {
  return (
      <ScrollView className="max-h-40">
        <VStack>
          {Object.entries(iconGroups).map(([g, icons]) => (
              <VStack key={g}>
                <Text className="text-sm text-primary-900">{g}</Text>
                <Divider/>
                <HStack className="py-2 px-1 w-full flex flex-wrap" space="md">
                  {icons.map((i) => (
                      <Pressable
                          key={i}
                          onPress={() => onChange(i)}
                      >
                        <Avatar size="sm" style={{backgroundColor: value === i ? valueColor : 'black'}}>
                          <MaterialIcon
                              code={i}
                              dsize={20}
                              dcolor="white"
                          />
                        </Avatar>
                      </Pressable>
                  ))}
                </HStack>
              </VStack>
          ))}
        </VStack>
      </ScrollView>
  )
}

export default IconSelect