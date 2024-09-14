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