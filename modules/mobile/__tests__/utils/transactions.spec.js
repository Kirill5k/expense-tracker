import {withinDates} from '@/utils/transactions'

const txs = [
  { date: '2024-10-01', id: '10' },
  { date: '2024-10-05', id: '15' },
  { date: '2024-10-10', id: '20' },
  { date: '2024-10-15', id: '25' },
  { date: '2024-10-20', id: '30' },
]

describe('withinDate', () => {
  test('when start and end dates are in the middle', () => {
    const start = new Date('2024-10-05T00:00:00Z')
    const end = new Date('2024-10-15T00:00:00Z')

    const result = withinDates(txs, {start, end})
    expect(result).toHaveLength(3)
    expect(result.map(t => t.id)).toEqual(['15', '20', '25'])
  })

  test('when start date is outside', () => {
    const start = new Date('2023-10-05T00:00:00Z')
    const end = new Date('2024-10-15T00:00:00Z')

    const result = withinDates(txs, {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['10', '15', '20', '25'])
  })

  test('when end date is outside', () => {
    const start = new Date('2024-10-05T00:00:00Z')
    const end = new Date('2025-10-15T00:00:00Z')

    const result = withinDates(txs, {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['15', '20', '25', '30'])
  })

  test('when both dates are outside', () => {
    const start = new Date('2025-10-05T00:00:00Z')
    const end = new Date('2025-10-15T00:00:00Z')

    const result = withinDates(txs, {start, end})
    expect(result).toHaveLength(0)
  })

  test('array is reversed and start and end dates are in the middle', () => {
    const start = new Date('2024-10-05T00:00:00Z')
    const end = new Date('2024-10-15T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(3)
    expect(result.map(t => t.id)).toEqual(['25', '20', '15'])
  })

  test('array is reversed and start date is outside', () => {
    const start = new Date('2023-10-05T00:00:00Z')
    const end = new Date('2024-10-15T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['25', '20', '15', '10'])
  })

  test('array is reversed and start date is outside and end date is on the edge', () => {
    const start = new Date('2023-10-05T00:00:00Z')
    const end = new Date('2024-10-01T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(1)
    expect(result.map(t => t.id)).toEqual(['10'])
  })

  test('array is reversed and start date is on the edge', () => {
    const start = new Date('2024-10-01T00:00:00Z')
    const end = new Date('2024-10-15T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['25', '20', '15', '10'])
  })

  test('array is reversed and start date is on the edge and end date is outside', () => {
    const start = new Date('2024-10-20T00:00:00Z')
    const end = new Date('2025-10-20T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(1)
    expect(result.map(t => t.id)).toEqual(['30'])
  })

  test('array is reversed and end date is outside', () => {
    const start = new Date('2024-10-05T00:00:00Z')
    const end = new Date('2025-10-15T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['30', '25', '20', '15'])
  })

  test('array is reversed and end date is on the edge', () => {
    const start = new Date('2024-10-05T00:00:00Z')
    const end = new Date('2024-10-20T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(4)
    expect(result.map(t => t.id)).toEqual(['30', '25', '20', '15'])
  })

  test('array is reversed and both dates are outside', () => {
    const start = new Date('2025-10-05T00:00:00Z')
    const end = new Date('2025-10-15T00:00:00Z')

    const result = withinDates(txs.slice().reverse(), {start, end})
    expect(result).toHaveLength(0)
  })
})