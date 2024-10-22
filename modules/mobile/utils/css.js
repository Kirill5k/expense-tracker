export const mergeClasses = (...args) => {
  let classes = ``
  for (const arg of args) {
    if (arg) {
      classes = classes + ' ' + arg
    }
  }
  return classes.trim()
}