import {generatePeriodTransactionRecurrenceInstanceId} from '@/db/operations'

describe('generatePeriodTransactionRecurrenceInstanceId', () => {
  test('should generate a deterministic id for periodic transaction recurrence instance', () => {
    const result = generatePeriodTransactionRecurrenceInstanceId("673cb70801452339cd5b4ec1", "2024-10-10")

    expect(result).toEqual('67071900f0844c2b758161c0')
  })
})