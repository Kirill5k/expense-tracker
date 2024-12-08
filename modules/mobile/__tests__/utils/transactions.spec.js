import {subMonths, addMonths, format} from 'date-fns'
import {generateRecurrences, calculateRecurrenceNextDate} from '@/utils/transactions'

describe('calculateRecurrenceNextDate', () => {
  test('startDate is before today and endDate is not defined', () => {
    const rtx = {
      recurrence: {
        startDate: '2024-10-01',
        nextDate: null,
        endDate: null,
        interval: 1,
        frequency: "monthly"
      }
    }

    expect(calculateRecurrenceNextDate(rtx, '2024-11-01')).toBe('2024-12-01')
  })

  test('startDate is before today and endDate is in the future', () => {
    const rtx = {
      recurrence: {
        startDate: '2024-10-01',
        nextDate: null,
        endDate: '2025-10-01',
        interval: 1,
        frequency: "monthly"
      }
    }

    expect(calculateRecurrenceNextDate(rtx, '2024-11-01')).toBe('2024-12-01')
  })

  test('startDate is before today and endDate is before today', () => {
    const rtx = {
      recurrence: {
        startDate: '2024-10-01',
        nextDate: null,
        endDate: '2024-10-30',
        interval: 1,
        frequency: "monthly"
      }
    }

    expect(calculateRecurrenceNextDate(rtx, '2024-11-01')).toBe(null)
  })

  test('startDate is before today and endDate is today', () => {
    const rtx = {
      recurrence: {
        startDate: '2024-10-01',
        nextDate: null,
        endDate: '2024-11-01',
        interval: 1,
        frequency: "monthly"
      }
    }

    expect(calculateRecurrenceNextDate(rtx, '2024-11-01')).toBe(null)
  })

  test('startDate is in the future and endDate is not defined', () => {
    const rtx = {
      recurrence: {
        startDate: '2025-01-01',
        nextDate: null,
        endDate: null,
        interval: 1,
        frequency: "monthly"
      }
    }

    expect(calculateRecurrenceNextDate(rtx, '2024-11-01')).toBe('2025-01-01')
  })
})

describe('generateTxInstances', () => {
  const now = new Date()

  describe('nextDate is null', () => {
    test('startDate is before today and endDate is not defined', () => {
      const rtx = {
        id: "67408afdbd1e1a12e9da68ba",
        categoryId: "61041a74937c172e4baaa550",
        recurrence: {
          startDate: format(subMonths(now, 5), 'yyyy-MM-dd'),
          nextDate: null,
          endDate: null,
          interval: 1,
          frequency: "monthly"
        },
        amount: {value: 15, currency: {code: "GBP", symbol: "£"}},
        note: "test tx",
        tags: ["foo"]
      }

      const {transactions, recurringTransaction} = generateRecurrences(rtx)

      expect(transactions).toHaveLength(6)
      expect(recurringTransaction.recurrence.nextDate).toBe(format(addMonths(now, 1), 'yyyy-MM-dd'))
    })

    test('startDate is before today and endDate is before today', () => {
      const endDate = subMonths(now, 1)
      const rtx = {
        id: "67408afdbd1e1a12e9da68ba",
        categoryId: "61041a74937c172e4baaa550",
        recurrence: {
          startDate: format(subMonths(now, 5), 'yyyy-MM-dd'),
          nextDate: null,
          endDate: format(endDate, 'yyyy-MM-dd'),
          interval: 1,
          frequency: "monthly"
        },
        amount: {value: 15, currency: {code: "GBP", symbol: "£"}},
        note: "test tx",
        tags: ["foo"]
      }

      const {transactions, recurringTransaction} = generateRecurrences(rtx)

      expect(transactions).toHaveLength(4)
      expect(recurringTransaction.recurrence.nextDate).toBe(null)
    })

    test('startDate is in the future', () => {
      const startDate = addMonths(now, 1)
      const rtx = {
        id: "67408afdbd1e1a12e9da68ba",
        categoryId: "61041a74937c172e4baaa550",
        recurrence: {
          startDate: format(addMonths(now, 1), 'yyyy-MM-dd'),
          nextDate: null,
          endDate: null,
          interval: 1,
          frequency: "monthly"
        },
        amount: {value: 15, currency: {code: "GBP", symbol: "£"}},
        note: "test tx",
        tags: ["foo"]
      }

      const {transactions, recurringTransaction} = generateRecurrences(rtx)

      expect(transactions).toHaveLength(0)
      expect(recurringTransaction.recurrence.nextDate).toBe(format(startDate, 'yyyy-MM-dd'))
    })
  })

  describe('nextDate is defined', () => {
    test('nextDate is today and endDate is not defined', () => {
      const rtx = {
        id: "67408afdbd1e1a12e9da68ba",
        categoryId: "61041a74937c172e4baaa550",
        recurrence: {
          startDate: format(subMonths(now, 5), 'yyyy-MM-dd'),
          nextDate: format(now, 'yyyy-MM-dd'),
          endDate: null,
          interval: 1,
          frequency: "monthly"
        },
        amount: {value: 15, currency: {code: "GBP", symbol: "£"}},
        note: "test tx",
        tags: ["foo"]
      }

      const {transactions, recurringTransaction} = generateRecurrences(rtx)

      expect(transactions).toHaveLength(1)
      expect(recurringTransaction.recurrence.nextDate).toBe(format(addMonths(now, 1), 'yyyy-MM-dd'))
    })
  })
})