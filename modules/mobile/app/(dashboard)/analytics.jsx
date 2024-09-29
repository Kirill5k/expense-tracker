import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Heading} from '@/components/ui/heading'
import {ScrollView} from '@/components/ui/scroll-view'
import {ProgressBar} from '@/components/common/progress'
import DatePeriodSelect from '@/components/common/date-period-select'
import Classes from '@/constants/classes'
import useStore from '@/store'

const Analytics = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    mode,
    displayDate,
    setDisplayDate,
    user,
    displayedTransactions
  } = useStore()

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Analytics
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={displayDate}
            onSelect={setDisplayDate}
        />
        {isScrolling && <Divider/>}
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
        </ScrollView>
      </VStack>
  )
}

export default Analytics