export const isPositiveNumber = (val) => {
  if (isNaN(val)) {
    return false
  }

  return Number(val) > 0
}

export const containsUniqueElements = (arr) => {
  return new Set(arr).size === arr.length
}