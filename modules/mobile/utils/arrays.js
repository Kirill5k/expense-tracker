export const groupBy = (arr, f) => arr.reduce((acc, item) => {
  const key = f(item);
  if (!acc[key]) {
    acc[key] = []
  }
  acc[key].push(item)
  return acc
}, {})

export const createLookup = (arr, f) => arr.reduce((acc, item) => {
  const key = f(item);
  acc[key] = item
  return acc
}, {})

export const insertSorted = (arr, newItem, f) => {
  let left = 0
  let right = arr.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (f(arr[mid]) < f(newItem)) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  return [...arr.slice(0, left), newItem, ...arr.slice(left)]
}

export const sortedBy = (arr, f) => {
  return arr.slice().sort((a, b) => {
    const aValue = f(a)
    const bValue = f(b)

    if (aValue < bValue) return -1
    if (aValue > bValue) return 1
    return 0
  });
}