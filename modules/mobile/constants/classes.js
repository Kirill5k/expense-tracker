export default {
  dashboardLayout: 'px-4 pt-2 pb-0 md:px-10 md:pt-6 md:pb-0 h-full w-full max-w-[1500px] self-center bg-background-0',
  scrollList: 'max-w-[600px] w-full',
  listItemLayout: 'items-center p-3',
  listItemHeader: 'mb-5 mt-4 p-3 rounded-xl bg-background-50 justify-between',
  listItemMainText: 'font-semibold text-primary-900 line-clamp-1 p-0 m-0 text-lg',
  listItemAmount: ' text-lg font-medium text-right ml-auto', // OLD: 'rounded-xl border text-md font-medium p-1 px-2 ml-auto'
  dark: {
    inputFieldBorder: 'border-secondary-400',
    invalidInputFieldBorder: 'border-red-300',
    selectedBorder: 'border-primary-400'
  },
  light: {
    inputFieldBorder: 'border-secondary-200',
    invalidInputFieldBorder: 'border-red-600',
    selectedBorder: 'border-primary-200'
  }
}