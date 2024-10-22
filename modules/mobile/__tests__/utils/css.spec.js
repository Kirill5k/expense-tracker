import {mergeClasses} from '@/utils/css'

describe('mergeClasses', () => {
  test('should merge css classes into 1 string', () => {
    const result = mergeClasses(
        'class1',
        true && 'class2',
        false && 'class3',
        true ? 'class4' : 'class 5',
        false || 'class6'
    )
    expect(result).toEqual('class1 class2 class4 class6')
  })
})