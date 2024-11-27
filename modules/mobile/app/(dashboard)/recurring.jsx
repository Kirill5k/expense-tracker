import {useEffect, useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import Classes from '@/constants/classes'

import {generatePeriodicTransactionRecurrenceInstanceId} from '@/db/operations'


const Recurring = ({}) => {
  const [testId, setTestId] = useState(null)

  useEffect(() => {
    const runTest = async () => {
      const id = await generatePeriodicTransactionRecurrenceInstanceId("673cb70801452339cd5b4ec1", "2024-10-10")
      setTestId(id)
    }
    runTest()
  }, []);

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size="2xl" className="pb-2">
          Recurring
        </Heading>
        <Text>
          {testId} - 67071900f0844c2b758161c0
        </Text>
      </VStack>
  )
}

export default Recurring
