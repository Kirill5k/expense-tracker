export const zipFlat = (arr1, arr2) => {
  const minLength = Math.min(arr1.length, arr2.length);
  const zipped = [];

  for (let i = 0; i < minLength; i++) {
    zipped.push(arr1[i])
    zipped.push(arr2[i])
  }

  return zipped;
}

export const groupBy = (arr, f) => arr.reduce((acc, item) => {
  const key = f(item);
  if (!acc[key]) {
    acc[key] = []
  }
  acc[key].push(item)
  return acc
}, {})

export const createLookup = (arr, getKey, mapItem = i => i) => arr.reduce((acc, item) => {
  const mappedItem = mapItem(item)
  const key = getKey(mappedItem);
  acc[key] = mappedItem
  return acc
}, {})

export const insertSorted = (arr, newItem, f, ascending = true) => {
  let left = 0
  let right = arr.length

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const comparison = f(arr[mid]) < f(newItem)

    if (ascending ? comparison : !comparison) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  return [...arr.slice(0, left), newItem, ...arr.slice(left)];
}

export const sortedBy = (arr, f, ascending = true) => {
  return arr.slice().sort((a, b) => {
    const aValue = f(a)
    const bValue = f(b)

    if (aValue < bValue) return ascending ? -1 : 1
    if (aValue > bValue) return ascending ? 1 : -1
    return 0
  });
}

export const nonEmpty = (arr) => arr && arr.length > 0