import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Classes from '@/constants/classes'
import ToggleButton from '@/components/common/toggle-button'
import FloatingButton from '@/components/common/floating-button'
import {ProgressBar} from '@/components/common/progress'
import RecurringTransactionList from '@/components/recurring/list'
import {useColorScheme} from '@/components/useColorScheme'
import {enhanceWithCategories} from '@/db/observers'
import {hideRecurringTransaction} from '@/db/operations'
import useStore from '@/store'
import {router} from 'expo-router'
import {useDatabase} from '@nozbe/watermelondb/react'


const kinds = [
  {label: 'All', value: 'all'},
  {label: 'Spending', value: 'expense'},
  {label: 'Income', value: 'income'}
]

const Recurring = ({categories}) => {
  const database = useDatabase()
  const mode = useColorScheme()

  const {setUndoAlert, setRtxToUpdate} = useStore()
  const [kind, setKind] = useState(kinds[0])
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleItemDelete = (rtx) => {
    setLoading(true)
    hideRecurringTransaction(database, rtx.id, true)
        .then(() => setUndoAlert('Recurring transaction has been deleted', () => hideRecurringTransaction(database, rtx.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemPress = (rtx) => {
    setRtxToUpdate(rtx)
    router.push('recurring')
  }

  const handleFabPress = () => {
    setRtxToUpdate(null)
    router.push('recurring')
  }

  const displayedTxs = kind.value === 'all' ? txs : txs.filter(tx => tx.category.kind === kind.value)

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'md' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Recurring
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <ToggleButton
            className="mb-2"
            size="lg"
            value={kind}
            items={kinds}
            onChange={setKind}
        />
        <RecurringTransactionList
            items={displayedTxs}
            disabled={loading}
            onItemPress={handleItemPress}
            onItemDelete={handleItemDelete}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        />
        <FloatingButton
            onPress={handleFabPress}
            mode={mode}
            iconCode={"plus"}
        />
      </VStack>
  )
}

export default enhanceWithCategories(Recurring)


const txs = [
  {
    id: "67408afdbd1e1a12e9da68ba",
    categoryId: "61041a74937c172e4baaa550",
    recurrence: {
      startDate: "2024-09-06",
      nextDate: "2024-12-05",
      endDate: "2024-12-30",
      interval: 1,
      frequency: "daily"
    },
    amount: {
      value: 15,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    note: "test tx",
    tags: [
      "foo"
    ],
    category: {
      id: "61041a74937c172e4baaa550",
      name: "Holidays",
      icon: "mdi-bag-carry-on",
      kind: "expense",
      color: "#00BFA5"
    }
  },
  {
    id: "67408c5ebd1e1a12e9da68bb",
    categoryId: "61041a74937c172e4baaa555",
    recurrence: {
      startDate: "2024-09-06",
      nextDate: "2024-12-10",
      endDate: null,
      interval: 1,
      frequency: "daily"
    },
    amount: {
      value: 15,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    note: "Test tx",
    tags: [
    ],
    category: {
      id: "61041a74937c172e4baaa555",
      name: "Entertainment",
      icon: "mdi-drama-masks",
      kind: "expense",
      color: "#D500F9"
    }
  },
  {
    id: "67408f8d1747ae334b41f964",
    categoryId: "671f91e4fa5d5e39ff022935",
    recurrence: {
      startDate: "2024-09-06",
      nextDate: "2024-12-10",
      endDate: null,
      interval: 2,
      frequency: "daily"
    },
    amount: {
      value: 15,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    tags: [
      "foo"
    ],
    category: {
      id: "671f91e4fa5d5e39ff022935",
      name: "Investments",
      icon: "mdi-chart-areaspline",
      kind: "income",
      color: "#2962FF"
    }
  }
]